import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';
import {
  databaseConnections,
  type databaseConnections as DatabaseConnectionsType,
} from '~/server/db/schema';
import {
  encryptSensitiveData,
  decryptSensitiveData,
} from '~/server/db/encryption';
import { connectionPool } from '~/server/db/connection-pool';
import {
  getTables,
  getTableColumns,
  getTableData,
  executeQuery,
  getSchemas,
  testConnection,
} from '~/server/db/query-utils';
import { eq, and } from 'drizzle-orm';

type DatabaseConnection = typeof DatabaseConnectionsType.$inferSelect;

// Helper to throw if connection not found
function getConnectionOrThrow(
  connection: DatabaseConnection | undefined
): DatabaseConnection {
  if (!connection) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Connection not found',
    });
  }
  return connection;
}

// Validation schemas
const connectionStringConnectionSchema = z.object({
  name: z.string().min(1, 'Connection name is required'),
  connectionString: z.string().min(1, 'Connection string is required'),
});

const manualConnectionSchema = z.object({
  name: z.string().min(1, 'Connection name is required'),
  host: z.string().min(1, 'Host is required'),
  port: z.number().min(1).max(65535, 'Invalid port number'),
  username: z.string().min(1, 'Username is required'),
  password: z.string(),
  database: z.string().min(1, 'Database name is required'),
  ssl: z.boolean().default(false),
  sslMode: z
    .enum(['disable', 'prefer', 'require', 'verify-full'])
    .default('disable'),
});

const connectionInputSchema = z.union([
  connectionStringConnectionSchema.extend({
    connectionType: z.literal('connection_string'),
  }),
  manualConnectionSchema.extend({
    connectionType: z.literal('manual'),
  }),
]);

export const databaseRouter = createTRPCRouter({
  /**
   * Create a new database connection
   */
  createConnection: protectedProcedure
    .input(connectionInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        let encryptedPassword: string | null = null;
        let encryptedConnectionString: string | null = null;

        if (input.connectionType === 'connection_string') {
          encryptedConnectionString = encryptSensitiveData(
            input.connectionString
          );
        } else {
          encryptedPassword = input.password
            ? encryptSensitiveData(input.password)
            : null;
        }

        const result = await ctx.db
          .insert(databaseConnections)
          .values({
            userId: ctx.userId,
            name: input.name,
            connectionType: input.connectionType,
            connectionString: encryptedConnectionString,
            host: input.connectionType === 'manual' ? input.host : null,
            port: input.connectionType === 'manual' ? input.port : null,
            username: input.connectionType === 'manual' ? input.username : null,
            password: encryptedPassword,
            database: input.connectionType === 'manual' ? input.database : null,
            ssl: input.connectionType === 'manual' ? input.ssl : false,
            sslMode:
              input.connectionType === 'manual' ? input.sslMode : 'disable',
          })
          .returning();

        if (!result.length) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create connection',
          });
        }

        const connection = result.at(0);

        if (!connection) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create connection',
          });
        }

        // Test the connection before returning
        const db = await connectionPool.getConnection(connection);
        const isConnected = await testConnection(db);

        if (!isConnected) {
          // Delete the connection if test fails
          await ctx.db
            .delete(databaseConnections)
            .where(eq(databaseConnections.id, connection.id));
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Failed to connect to the database',
          });
        }

        return connection;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to create connection',
        });
      }
    }),

  /**
   * Get all connections for the current user
   */
  listConnections: protectedProcedure.query(async ({ ctx }) => {
    const connections = await ctx.db
      .select()
      .from(databaseConnections)
      .where(eq(databaseConnections.userId, ctx.userId));

    // Return without sensitive data
    return connections.map((conn) => ({
      id: conn.id,
      name: conn.name,
      connectionType: conn.connectionType,
      host: conn.host,
      port: conn.port,
      username: conn.username,
      database: conn.database,
      ssl: conn.ssl,
      sslMode: conn.sslMode,
      isActive: conn.isActive,
      createdAt: conn.createdAt,
    }));
  }),

  /**
   * Get a specific connection
   */
  getConnection: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const connection = await ctx.db
        .select()
        .from(databaseConnections)
        .where(
          and(
            eq(databaseConnections.id, input.id),
            eq(databaseConnections.userId, ctx.userId)
          )
        );

      if (!connection.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Connection not found',
        });
      }

      return connection[0];
    }),

  /**
   * Get connection statistics (table count, etc.)
   */
  getConnectionStats: protectedProcedure
    .input(z.object({ connectionId: z.number() }))
    .query(async ({ ctx, input }) => {
      const connections = await ctx.db
        .select()
        .from(databaseConnections)
        .where(
          and(
            eq(databaseConnections.id, input.connectionId),
            eq(databaseConnections.userId, ctx.userId)
          )
        );

      const connection = connections.at(0);
      if (!connection) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Connection not found',
        });
      }

      try {
        const db = await connectionPool.getConnection(connection);
        const tables = await getTables(db);

        return {
          tableCount: tables.length,
          databaseName: connection.database,
          createdAt: connection.createdAt,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to fetch connection stats',
        });
      }
    }),

  /**
   * Update a database connection
   */
  updateConnection: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // If closing the connection, disconnect from the pool first
      if (input.isActive === false) {
        await connectionPool.closeConnection(input.id);
      }

      const updated = await ctx.db
        .update(databaseConnections)
        .set({
          name: input.name,
          isActive: input.isActive,
        })
        .where(
          and(
            eq(databaseConnections.id, input.id),
            eq(databaseConnections.userId, ctx.userId)
          )
        );

      return updated;
    }),

  /**
   * Delete a database connection
   */
  deleteConnection: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Close the connection in the pool
      await connectionPool.closeConnection(input.id);

      // Delete from database
      const deleted = await ctx.db
        .delete(databaseConnections)
        .where(
          and(
            eq(databaseConnections.id, input.id),
            eq(databaseConnections.userId, ctx.userId)
          )
        );

      return deleted;
    }),

  /**
   * Test a database connection
   */
  testConnection: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const connections = await ctx.db
        .select()
        .from(databaseConnections)
        .where(
          and(
            eq(databaseConnections.id, input.id),
            eq(databaseConnections.userId, ctx.userId)
          )
        );

      const connection = connections.at(0);
      if (!connection) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Connection not found',
        });
      }

      try {
        const db = await connectionPool.getConnection(connection);
        const isConnected = await testConnection(db);

        return { connected: isConnected };
      } catch (error) {
        return {
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }),

  /**
   * Get all tables from a database connection
   * Auto-activates connection on successful access (via heartbeat)
   */
  getTables: protectedProcedure
    .input(z.object({ connectionId: z.number() }))
    .query(async ({ ctx, input }) => {
      const connections = await ctx.db
        .select()
        .from(databaseConnections)
        .where(
          and(
            eq(databaseConnections.id, input.connectionId),
            eq(databaseConnections.userId, ctx.userId)
          )
        );

      const connection = connections.at(0);
      if (!connection) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Connection not found',
        });
      }

      try {
        // getConnection automatically updates lastUsed
        const db = await connectionPool.getConnection(connection);
        const tables = await getTables(db);

        // Auto-activate on first successful access
        if (!connection.isActive) {
          await ctx.db
            .update(databaseConnections)
            .set({ isActive: true, updatedAt: new Date() })
            .where(eq(databaseConnections.id, input.connectionId));
        }

        return tables;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            error instanceof Error ? error.message : 'Failed to fetch tables',
        });
      }
    }),

  /**
   * Get columns from a table
   * Auto-activates connection when accessed
   */
  getTableColumns: protectedProcedure
    .input(
      z.object({
        connectionId: z.number(),
        tableName: z.string(),
        schemaName: z.string().default('public'),
      })
    )
    .query(async ({ ctx, input }) => {
      const connections = await ctx.db
        .select()
        .from(databaseConnections)
        .where(
          and(
            eq(databaseConnections.id, input.connectionId),
            eq(databaseConnections.userId, ctx.userId)
          )
        );

      const connection = connections.at(0);
      if (!connection) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Connection not found',
        });
      }

      try {
        const db = await connectionPool.getConnection(connection);
        const columns = await getTableColumns(
          db,
          input.tableName,
          input.schemaName
        );

        // Auto-activate connection on successful access
        if (!connection.isActive) {
          await ctx.db
            .update(databaseConnections)
            .set({ isActive: true, updatedAt: new Date() })
            .where(eq(databaseConnections.id, input.connectionId));
        }

        return columns;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to fetch table columns',
        });
      }
    }),

  /**
   * Get data from a table with pagination
   * Auto-activates connection when accessed
   */
  getTableData: protectedProcedure
    .input(
      z.object({
        connectionId: z.number(),
        tableName: z.string(),
        schemaName: z.string().default('public'),
        limit: z.number().min(1).max(1000).default(100),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const connections = await ctx.db
        .select()
        .from(databaseConnections)
        .where(
          and(
            eq(databaseConnections.id, input.connectionId),
            eq(databaseConnections.userId, ctx.userId)
          )
        );

      const connection = connections.at(0);
      if (!connection) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Connection not found',
        });
      }

      try {
        const db = await connectionPool.getConnection(connection);
        const data = await getTableData(
          db,
          input.tableName,
          input.schemaName,
          input.limit,
          input.offset
        );

        // Auto-activate connection on successful access
        if (!connection.isActive) {
          await ctx.db
            .update(databaseConnections)
            .set({ isActive: true, updatedAt: new Date() })
            .where(eq(databaseConnections.id, input.connectionId));
        }

        return data;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to fetch table data',
        });
      }
    }),

  /**
   * Execute a custom SQL query
   */
  executeQuery: protectedProcedure
    .input(
      z.object({
        connectionId: z.number(),
        query: z.string().min(1, 'Query is required'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const connections = await ctx.db
        .select()
        .from(databaseConnections)
        .where(
          and(
            eq(databaseConnections.id, input.connectionId),
            eq(databaseConnections.userId, ctx.userId)
          )
        );

      const connection = connections.at(0);
      if (!connection) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Connection not found',
        });
      }

      try {
        const db = await connectionPool.getConnection(connection);
        return await executeQuery(db, input.query);
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            error instanceof Error ? error.message : 'Query execution failed',
        });
      }
    }),

  /**
   * Reconnect an inactive database connection
   * Tests the connection and marks it as active if successful
   */
  reconnectConnection: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const connections = await ctx.db
        .select()
        .from(databaseConnections)
        .where(
          and(
            eq(databaseConnections.id, input.id),
            eq(databaseConnections.userId, ctx.userId)
          )
        );

      const connection = connections.at(0);
      if (!connection) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Connection not found',
        });
      }

      try {
        // Get fresh connection and test it
        const db = await connectionPool.getConnection(connection);
        const isConnected = await testConnection(db);

        if (!isConnected) {
          throw new Error('Connection test failed');
        }

        // Update connection to active
        const updated = await ctx.db
          .update(databaseConnections)
          .set({
            isActive: true,
            updatedAt: new Date(),
          })
          .where(eq(databaseConnections.id, input.id))
          .returning();

        return { success: true, connection: updated.at(0) };
      } catch (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to reconnect to database',
        });
      }
    }),

  /**
   * Get all schemas from a database
   */
  getSchemas: protectedProcedure
    .input(z.object({ connectionId: z.number() }))
    .query(async ({ ctx, input }) => {
      const connections = await ctx.db
        .select()
        .from(databaseConnections)
        .where(
          and(
            eq(databaseConnections.id, input.connectionId),
            eq(databaseConnections.userId, ctx.userId)
          )
        );

      const connection = connections.at(0);
      if (!connection) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Connection not found',
        });
      }

      try {
        const db = await connectionPool.getConnection(connection);
        return await getSchemas(db);
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            error instanceof Error ? error.message : 'Failed to fetch schemas',
        });
      }
    }),
});
