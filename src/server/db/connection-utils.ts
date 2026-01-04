import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import type { Kysely } from 'kysely';
import type { db } from '~/server/db';
import { connectionPool } from '~/server/db/connection-pool';
import { databaseConnections } from '~/server/db/schema';

interface Context {
  db: typeof db;
  userId: string;
}

/**
 * Retrieves and validates a database connection for the current user.
 *
 * @param ctx - The TRPC context containing the database client and user session
 * @param connectionId - The ID of the connection to retrieve
 * @returns A promise that resolves to an initialized Kysely database instance
 * @throws TRPCError if the connection is not found or fails to initialize
 */
export async function getValidatedConnection(
  ctx: Context,
  connectionId: number,
  options: { updateLastUsed?: boolean } = { updateLastUsed: true }
): Promise<Kysely<any>> {
  if (!ctx.userId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Not authenticated',
    });
  }

  const connection = await ctx.db.query.databaseConnections.findFirst({
    where: and(
      eq(databaseConnections.id, connectionId),
      eq(databaseConnections.userId, ctx.userId)
    ),
  });

  if (!connection) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Database connection not found',
    });
  }

  try {
    return await connectionPool.getConnection(connection, options);
  } catch (error) {
    console.error('Failed to get connection from pool:', error);
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message:
        error instanceof Error
          ? error.message
          : 'Failed to connect to the database',
    });
  }
}

/**
 * Parses a PostgreSQL connection string and extracts available components.
 * Supports both URI format (postgresql://user:pass@host:port/db)
 * and key-value format (host=localhost port=5432 ...).
 */
export function parseAllFromConnectionString(connectionString: string) {
  const result: {
    host: string | null;
    port: number | null;
    username: string | null;
    database: string | null;
  } = {
    host: null,
    port: null,
    username: null,
    database: null,
  };

  try {
    if (
      connectionString.startsWith('postgresql://') ||
      connectionString.startsWith('postgres://')
    ) {
      const url = new URL(connectionString);
      result.host = url.hostname || null;
      result.port = url.port ? Number.parseInt(url.port, 10) : null;
      result.username = url.username || null;
      result.database = url.pathname.replace(/^\//, '') || null;
      return result;
    }

    // Fallback for key-value format (libpq style)
    const hostMatch = connectionString.match(/(?:^|\s)host=([^\s]+)/);
    const portMatch = connectionString.match(/(?:^|\s)port=([^\s]+)/);
    const userMatch = connectionString.match(/(?:^|\s)user=([^\s]+)/);
    const dbMatch = connectionString.match(/(?:^|\s)dbname=([^\s]+)/);

    result.host = hostMatch?.[1] ?? null;
    result.port = portMatch?.[1] ? Number.parseInt(portMatch[1], 10) : null;
    result.username = userMatch?.[1] ?? null;
    result.database = dbMatch?.[1] ?? null;

    return result;
  } catch (_e) {
    return result;
  }
}
