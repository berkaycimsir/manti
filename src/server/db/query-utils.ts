import type { Kysely, RawBuilder } from 'kysely';
import { sql } from 'kysely';
import { db } from '~/server/db';
import { databaseConnections } from '~/server/db/schema';
import { eq } from 'drizzle-orm';

export interface Table {
  name: string;
  schema: string;
}

export interface Column {
  name: string;
  type: string;
  nullable: boolean;
  default?: string;
}

export interface QueryResult {
  rows: Array<Record<string, unknown>>;
  rowCount: number;
  command?: string;
}

/**
 * Get all tables in a database
 */
export async function getTables(db: Kysely<any>): Promise<Table[]> {
  const result = await sql<{ tablename: string; schemaname: string }>`
    SELECT tablename, schemaname 
    FROM pg_tables 
    WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
    ORDER BY schemaname, tablename
  `.execute(db);

  return result.rows.map((row) => ({
    name: row.tablename,
    schema: row.schemaname,
  }));
}

/**
 * Get columns for a specific table
 */
export async function getTableColumns(
  db: Kysely<any>,
  tableName: string,
  schemaName = 'public'
): Promise<Column[]> {
  const result = await sql<{
    column_name: string;
    data_type: string;
    is_nullable: string;
    column_default: string | null;
  }>`
    SELECT 
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_schema = ${schemaName} AND table_name = ${tableName}
    ORDER BY ordinal_position
  `.execute(db);

  return result.rows.map((row) => ({
    name: row.column_name,
    type: row.data_type,
    nullable: row.is_nullable === 'YES',
    default: row.column_default ?? undefined,
  }));
}

/**
 * Execute a custom SQL query
 */
export async function executeQuery(
  db: Kysely<any>,
  query: string
): Promise<QueryResult> {
  try {
    const result = await sql.raw(query).execute(db);

    if (Array.isArray(result.rows)) {
      return {
        rows: result.rows as Array<Record<string, unknown>>,
        rowCount: result.rows.length,
        command: 'SELECT',
      };
    }

    // For non-SELECT queries (INSERT, UPDATE, DELETE, etc.)
    return {
      rows: [],
      rowCount: result?.numAffectedRows ? Number(result.numAffectedRows) : 0,
      command: query.trim().split(/\s+/)[0]?.toUpperCase() ?? 'UNKNOWN',
    };
  } catch (error) {
    throw new Error(
      `Query execution failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Get all schemas in a database
 */
export async function getSchemas(db: Kysely<any>): Promise<string[]> {
  const result = await sql<{ schema_name: string }>`
    SELECT schema_name 
    FROM information_schema.schemata
    WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_internal')
    ORDER BY schema_name
  `.execute(db);

  return result.rows.map((row) => row.schema_name);
}

/**
 * Get table size in bytes
 */
export async function getTableSize(
  db: Kysely<any>,
  tableName: string,
  schemaName = 'public'
): Promise<number> {
  const result = await sql<{ size: string | number }>`
    SELECT pg_total_relation_size(${`"${schemaName}"."${tableName}"`}) as size
  `.execute(db);

  const size = result.rows[0]?.size;
  return typeof size === 'string' ? Number.parseInt(size, 10) : size ?? 0;
}

/**
 * Get row count for a table
 */
export async function getTableRowCount(
  db: Kysely<any>,
  tableName: string,
  schemaName = 'public'
): Promise<number> {
  const result = await sql<{ count: string | number }>`
    SELECT COUNT(*) as count FROM ${sql.table(`${schemaName}.${tableName}`)}
  `.execute(db);

  const count = result.rows[0]?.count;
  return typeof count === 'string' ? Number.parseInt(count, 10) : count ?? 0;
}

/**
 * Test database connection
 */
export async function testConnection(db: Kysely<any>): Promise<boolean> {
  try {
    await sql`SELECT 1`.execute(db);
    return true;
  } catch {
    return false;
  }
}

/**
 * Mark a database connection as inactive
 */
export async function markConnectionAsInactive(
  connectionId: number
): Promise<void> {
  try {
    await db
      .update(databaseConnections)
      .set({ isActive: false, lastUsedAt: null })
      .where(eq(databaseConnections.id, connectionId));

    console.log(
      `[QueryUtils] Successfully marked connection ${connectionId} as inactive`
    );
  } catch (error) {
    console.error(
      `[QueryUtils] Failed to mark connection ${connectionId} as inactive:`,
      error
    );
    throw error;
  }
}

/**
 * Update the lastUsedAt timestamp for a connection
 */
export async function updateConnectionLastUsed(
  connectionId: number
): Promise<void> {
  try {
    await db
      .update(databaseConnections)
      .set({ lastUsedAt: new Date(), isActive: true })
      .where(eq(databaseConnections.id, connectionId));
  } catch (error) {
    console.error(
      `[QueryUtils] Failed to update lastUsedAt for connection ${connectionId}:`,
      error
    );
    // Don't throw - this is not critical
  }
}

/**
 * Get the lastUsedAt timestamp for a connection
 */
export async function getConnectionLastUsed(
  connectionId: number
): Promise<Date | null> {
  try {
    const result = await db
      .select({ lastUsedAt: databaseConnections.lastUsedAt })
      .from(databaseConnections)
      .where(eq(databaseConnections.id, connectionId));

    return result[0]?.lastUsedAt ?? null;
  } catch (error) {
    console.error(
      `[QueryUtils] Failed to get lastUsedAt for connection ${connectionId}:`,
      error
    );
    return null;
  }
}
