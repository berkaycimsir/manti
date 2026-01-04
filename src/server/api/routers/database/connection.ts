import { TRPCError } from '@trpc/server';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';

import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';
import { connectionPool } from '~/server/db/connection-pool';
import {
  getValidatedConnection,
  parseAllFromConnectionString,
} from '~/server/db/connection-utils';
import { encryptSensitiveData } from '~/server/db/encryption';
import {
  getTables,
  testConnection as testConnectionUtil,
} from '~/server/db/query-utils';
import { databaseConnections } from '~/server/db/schema';

// Validation schemas
export const connectionStringConnectionSchema = z.object({
  name: z.string().min(1, 'Connection name is required'),
  connectionString: z.string().min(1, 'Connection string is required'),
});

export const manualConnectionSchema = z.object({
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

export const connectionInputSchema = z.union([
  connectionStringConnectionSchema.extend({
    connectionType: z.literal('connection_string'),
  }),
  manualConnectionSchema.extend({
    connectionType: z.literal('manual'),
  }),
]);

export const connectionRouter = createTRPCRouter({
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

        const connectionParams =
          input.connectionType === 'connection_string'
            ? parseAllFromConnectionString(input.connectionString)
            : null;

        const result = await ctx.db
          .insert(databaseConnections)
          .values({
            userId: ctx.userId,
            name: input.name,
            connectionType: input.connectionType,
            connectionString: encryptedConnectionString,
            host:
              input.connectionType === 'manual'
                ? input.host
                : connectionParams?.host,
            port:
              input.connectionType === 'manual'
                ? input.port
                : connectionParams?.port,
            username:
              input.connectionType === 'manual'
                ? input.username
                : connectionParams?.username,
            password: encryptedPassword,
            database:
              input.connectionType === 'manual'
                ? input.database
                : connectionParams?.database,
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
        try {
          const db = await connectionPool.getConnection(connection);
          const isConnected = await testConnectionUtil(db);

          if (!isConnected) {
            throw new Error('Connection test failed');
          }
        } catch (_error) {
          // Clean up if connection failed
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
      .where(eq(databaseConnections.userId, ctx.userId))
      .orderBy(
        desc(databaseConnections.isActive),
        desc(databaseConnections.lastUsedAt)
      );

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
      lastUsedAt: conn.lastUsedAt,
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
   * Get connection statistics
   */
  getConnectionStats: protectedProcedure
    .input(z.object({ connectionId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Use the new utility to get a validated connection
      const db = await getValidatedConnection(ctx, input.connectionId, {
        updateLastUsed: false,
      });

      // Get connection metadata for database name
      const connection = await ctx.db.query.databaseConnections.findFirst({
        where: eq(databaseConnections.id, input.connectionId),
        columns: { database: true, createdAt: true },
      });

      if (!connection) throw new TRPCError({ code: 'NOT_FOUND' });

      try {
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
        connectionType: z.enum(['manual', 'connection_string']).optional(),
        host: z.string().optional(),
        port: z.number().optional(),
        username: z.string().optional(),
        password: z.string().optional(),
        database: z.string().optional(),
        ssl: z.boolean().optional(),
        sslMode: z
          .enum(['disable', 'prefer', 'require', 'verify-full'])
          .optional(),
        connectionString: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.isActive === false) {
        await connectionPool.closeConnection(input.id);
      }

      // Prepare update data
      const updateData: any = {
        updatedAt: new Date(),
      };
      if (input.name !== undefined) updateData.name = input.name;
      if (input.isActive !== undefined) updateData.isActive = input.isActive;
      if (input.connectionType !== undefined) {
        updateData.connectionType = input.connectionType;
        // Reset fields not relevant to new type?
        if (input.connectionType === 'connection_string') {
          updateData.host = null;
          updateData.port = null;
          updateData.username = null;
          updateData.password = null;
          updateData.database = null;
          updateData.ssl = false;
          updateData.sslMode = 'disable';
        } else {
          updateData.connectionString = null;
        }
      }

      if (input.host !== undefined) updateData.host = input.host;
      if (input.port !== undefined) updateData.port = input.port;
      if (input.username !== undefined) updateData.username = input.username;
      if (input.database !== undefined) updateData.database = input.database;
      if (input.ssl !== undefined) updateData.ssl = input.ssl;
      if (input.sslMode !== undefined) updateData.sslMode = input.sslMode;

      if (input.password) {
        updateData.password = encryptSensitiveData(input.password);
      }

      if (input.connectionString) {
        updateData.connectionString = encryptSensitiveData(
          input.connectionString
        );

        const connectionParams = parseAllFromConnectionString(
          input.connectionString
        );

        // Update all extractable fields from the connection string
        if (updateData.host === undefined)
          updateData.host = connectionParams.host;
        if (updateData.port === undefined)
          updateData.port = connectionParams.port;
        if (updateData.username === undefined)
          updateData.username = connectionParams.username;
        if (updateData.database === undefined)
          updateData.database = connectionParams.database;
      }

      const updated = await ctx.db
        .update(databaseConnections)
        .set(updateData)
        .where(
          and(
            eq(databaseConnections.id, input.id),
            eq(databaseConnections.userId, ctx.userId)
          )
        )
        .returning();

      // Perform connection test if connection details changed (heuristic)
      const connectionDetailsChanged =
        input.host ||
        input.port ||
        input.database ||
        input.username ||
        input.password ||
        input.connectionString;
      if (connectionDetailsChanged && updated[0]?.isActive) {
        try {
          const db = await connectionPool.getConnection(updated[0]);
          const isConnected = await testConnectionUtil(db);
          if (!isConnected) throw new Error('Connection test failed');
        } catch (error) {
          // If test fails, mark inactive? or throw?
          // Reverting is hard. Let's mark inactive.
          await ctx.db
            .update(databaseConnections)
            .set({ isActive: false })
            .where(eq(databaseConnections.id, input.id));
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message:
              'Connection updated but connection test failed. Connection marked inactive.',
          });
        }
      }

      return updated;
    }),

  /**
   * Delete a database connection
   */
  deleteConnection: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await connectionPool.closeConnection(input.id);

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
      try {
        const db = await getValidatedConnection(ctx, input.id);
        const isConnected = await testConnectionUtil(db);
        return { connected: isConnected };
      } catch (error) {
        return {
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }),

  /**
   * Reconnect an inactive database connection
   */
  reconnectConnection: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getValidatedConnection(ctx, input.id);
        const isConnected = await testConnectionUtil(db);

        if (!isConnected) {
          throw new Error('Connection test failed');
        }

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
});
