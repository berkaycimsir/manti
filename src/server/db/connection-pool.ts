import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import type { databaseConnections } from '~/server/db/schema';
import { decryptSensitiveData } from '~/server/db/encryption';
import {
  markConnectionAsInactive,
  updateConnectionLastUsed,
  getConnectionLastUsed,
} from '~/server/db/query-utils';
import {
  CONNECTION_IDLE_TIMEOUT,
  CONNECTION_CLEANUP_INTERVAL,
} from '~/lib/constants';

type DatabaseConnection = typeof databaseConnections.$inferSelect;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyKysely = Kysely<any>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ConnectionPoolEntry {
  pool: Pool;
  db: AnyKysely;
  lastUsed: number;
  connectionId: number;
  closing?: boolean;
}

/**
 * Connection pool manager for user databases
 * Maintains multiple database connections with automatic cleanup
 */
class DatabaseConnectionPool {
  private connections: Map<number, ConnectionPoolEntry> = new Map();
  private maxPoolSize = 10; // Maximum number of concurrent connections
  private idleTimeout = CONNECTION_IDLE_TIMEOUT;
  private cleanupCheckInterval = CONNECTION_CLEANUP_INTERVAL;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private timerStarted = false;

  constructor() {
    // Start persistent cleanup timer
    this.startCleanupTimer();
  }

  /**
   * Start the persistent cleanup timer
   */
  private startCleanupTimer(): void {
    if (this.timerStarted) return; // Already started
    this.timerStarted = true;

    this.cleanupTimer = setInterval(() => {
      void this.cleanupIdleConnections();
    }, this.cleanupCheckInterval);

    // Allow the interval to not block process exit
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }

    console.log('[ConnectionPool] Cleanup timer started');
  }

  /**
   * Get or create a database connection
   * Automatically updates lastUsed timestamp and persists to database
   */
  async getConnection(
    connectionConfig: DatabaseConnection
  ): Promise<AnyKysely> {
    const existing = this.connections.get(connectionConfig.id);

    if (existing) {
      console.log(`[ConnectionPool] Reusing connection ${connectionConfig.id}`);
      existing.lastUsed = Date.now();
      // Persist the lastUsed timestamp to database
      void updateConnectionLastUsed(connectionConfig.id);
      return existing.db;
    }

    console.log(
      `[ConnectionPool] Creating new connection ${connectionConfig.id}`
    );

    if (this.connections.size >= this.maxPoolSize) {
      console.log(
        `[ConnectionPool] Pool at max size (${this.maxPoolSize}), running cleanup`
      );
      await this.cleanupIdleConnections();
      if (this.connections.size >= this.maxPoolSize) {
        throw new Error('Connection pool is full');
      }
    }

    const pool = this.createPool(connectionConfig);
    const db = new Kysely({
      dialect: new PostgresDialect({ pool }),
    });

    // Check if there's a persisted lastUsed timestamp from a previous session
    let lastUsed = Date.now();
    const persistedLastUsed = await getConnectionLastUsed(connectionConfig.id);
    if (persistedLastUsed && connectionConfig.isActive) {
      // Use the persisted timestamp if the connection was marked as active
      lastUsed = persistedLastUsed.getTime();
      console.log(
        `[ConnectionPool] Restored lastUsed for connection ${
          connectionConfig.id
        }: ${Math.round((Date.now() - lastUsed) / 1000)}s ago`
      );
    }

    const entry: ConnectionPoolEntry = {
      pool,
      db,
      lastUsed,
      connectionId: connectionConfig.id,
    };

    this.connections.set(connectionConfig.id, entry);

    // Persist the lastUsed timestamp to database
    void updateConnectionLastUsed(connectionConfig.id);

    console.log(
      `[ConnectionPool] Connection ${connectionConfig.id} created - Total connections: ${this.connections.size}`
    );
    return db;
  }

  /**
   * Create a connection pool from connection configuration
   */
  private createPool(connectionConfig: DatabaseConnection): Pool {
    let connectionString: string;

    if (connectionConfig.connectionType === 'connection_string') {
      if (!connectionConfig.connectionString) {
        throw new Error('Connection string is required');
      }
      connectionString = decryptSensitiveData(
        connectionConfig.connectionString
      );
    } else {
      // Build connection string from manual inputs
      if (
        !connectionConfig.host ||
        !connectionConfig.port ||
        !connectionConfig.username ||
        !connectionConfig.database
      ) {
        throw new Error('Missing required connection parameters');
      }

      const password = connectionConfig.password
        ? decryptSensitiveData(connectionConfig.password)
        : '';

      // Build SSL query parameter based on sslMode
      const sslParam =
        connectionConfig.sslMode && connectionConfig.sslMode !== 'disable'
          ? `?sslmode=${connectionConfig.sslMode}`
          : '';

      connectionString = `postgresql://${connectionConfig.username}:${password}@${connectionConfig.host}:${connectionConfig.port}/${connectionConfig.database}${sslParam}`;
    }

    return new Pool({
      connectionString,
      max: 10, // Max connections per pool
    });
  }

  /**
   * Close a specific connection
   */
  async closeConnection(connectionId: number): Promise<void> {
    const entry = this.connections.get(connectionId);

    if (entry && !entry.closing) {
      entry.closing = true;
      try {
        await entry.pool.end();
      } catch (error) {
        // Ignore errors when closing pool (might already be closed)
        console.error(`Error closing connection pool ${connectionId}:`, error);
      }
      this.connections.delete(connectionId);
    }
  }

  /**
   * Clean up idle connections
   */
  private async cleanupIdleConnections(): Promise<void> {
    console.log(
      `[ConnectionPool] Cleanup started - Active connections: ${this.connections.size}`
    );
    const now = Date.now();
    let cleanedCount = 0;

    for (const [id, entry] of this.connections.entries()) {
      const idleTime = now - entry.lastUsed;
      console.log(
        `[ConnectionPool] Connection ${id}: idle for ${Math.round(
          idleTime / 1000
        )}s (timeout: ${Math.round(this.idleTimeout / 1000)}s)`
      );

      if (idleTime > this.idleTimeout && !entry.closing) {
        console.log(`[ConnectionPool] Marking connection ${id} as inactive...`);
        entry.closing = true;
        cleanedCount++;

        // Mark connection as inactive in database
        try {
          await markConnectionAsInactive(id);
        } catch (error) {
          console.error(`Error marking connection ${id} as inactive:`, error);
        }

        // Close the connection pool
        entry.pool.end().catch((err) => {
          console.error(`Error closing connection pool ${id}:`, err);
        });

        this.connections.delete(id);
      }
    }

    console.log(
      `[ConnectionPool] Cleanup completed - Cleaned: ${cleanedCount}`
    );
  }

  /**
   * Close all connections
   */
  async closeAll(): Promise<void> {
    // Stop the cleanup timer
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    const promises = Array.from(this.connections.values())
      .filter((entry) => !entry.closing)
      .map((entry) => {
        entry.closing = true;
        return entry.pool.end().catch((err) => {
          console.error(
            `Error closing connection pool ${entry.connectionId}:`,
            err
          );
        });
      });

    await Promise.all(promises);
    this.connections.clear();
  }

  /**
   * Get number of active connections
   */
  getActiveConnections(): number {
    return this.connections.size;
  }
}

// Global singleton instance
const globalForPool = globalThis as unknown as {
  connectionPool?: DatabaseConnectionPool;
};

globalForPool.connectionPool ??= new DatabaseConnectionPool();

export const connectionPool = globalForPool.connectionPool;
