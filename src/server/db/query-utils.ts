import type { Kysely } from "kysely";
import { sql } from "kysely";
import type { SystemSchema } from "./system-schema";

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
	const sysDb = db as unknown as Kysely<SystemSchema>;
	const result = await sysDb
		.selectFrom("pg_catalog.pg_tables")
		.select(["tablename", "schemaname"])
		.where("schemaname", "not in", ["pg_catalog", "information_schema"])
		.orderBy("schemaname")
		.orderBy("tablename")
		.execute();

	return result.map((row) => ({
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
	schemaName = "public",
): Promise<Column[]> {
	const sysDb = db as unknown as Kysely<SystemSchema>;
	const result = await sysDb
		.selectFrom("information_schema.columns")
		.select(["column_name", "data_type", "is_nullable", "column_default"])
		.where("table_schema", "=", schemaName)
		.where("table_name", "=", tableName)
		.orderBy("ordinal_position")
		.execute();

	return result.map((row) => ({
		name: row.column_name,
		type: row.data_type,
		nullable: row.is_nullable === "YES",
		default: row.column_default ?? undefined,
	}));
}

/**
 * Execute a custom SQL query
 */
export async function executeQuery(
	db: Kysely<any>,
	query: string,
): Promise<QueryResult> {
	try {
		const result = await sql.raw(query).execute(db);

		if (Array.isArray(result.rows)) {
			return {
				rows: result.rows as Array<Record<string, unknown>>,
				rowCount: result.rows.length,
				command: "SELECT",
			};
		}

		// For non-SELECT queries (INSERT, UPDATE, DELETE, etc.)
		return {
			rows: [],
			rowCount: result?.numAffectedRows ? Number(result.numAffectedRows) : 0,
			command: query.trim().split(/\s+/)[0]?.toUpperCase() ?? "UNKNOWN",
		};
	} catch (error) {
		throw new Error(
			`Query execution failed: ${
				error instanceof Error ? error.message : "Unknown error"
			}`,
		);
	}
}

/**
 * Get all schemas in a database
 */
export async function getSchemas(db: Kysely<any>): Promise<string[]> {
	const sysDb = db as unknown as Kysely<SystemSchema>;
	const result = await sysDb
		.selectFrom("information_schema.schemata")
		.select("schema_name")
		.where("schema_name", "not in", [
			"pg_catalog",
			"information_schema",
			"pg_internal",
		])
		.orderBy("schema_name")
		.execute();

	return result.map((row) => row.schema_name);
}

/**
 * Get table size in bytes
 */
export async function getTableSize(
	db: Kysely<any>,
	tableName: string,
	schemaName = "public",
): Promise<number> {
	// Use bound parameters for safety instead of raw string injection
	const result = await sql<{ size: string | number }>`
    SELECT pg_total_relation_size(quote_ident(${schemaName}) || '.' || quote_ident(${tableName})) as size
  `.execute(db);

	const size = result.rows[0]?.size;
	return typeof size === "string"
		? Number.parseInt(size, 10)
		: Number(size ?? 0);
}

/**
 * Get row count for a table
 */

export async function getTableRowCount(
	db: Kysely<any>,
	tableName: string,
	schemaName = "public",
): Promise<number> {
	const result = await db
		.withSchema(schemaName)
		.selectFrom(tableName)
		.select(db.fn.countAll<string | number>().as("count"))
		.executeTakeFirst();

	const count = result?.count;
	return typeof count === "string"
		? Number.parseInt(count, 10)
		: Number(count ?? 0);
}

/**
 * Get table data with pagination
 */
export async function getTableData(
	db: Kysely<any>,
	tableName: string,
	schemaName = "public",
	limit = 100,
	offset = 0,
): Promise<{ rows: Array<Record<string, unknown>>; totalCount: number }> {
	// Get total count first using builder
	const countResult = await db
		.withSchema(schemaName)
		.selectFrom(tableName)
		.select(db.fn.countAll<string | number>().as("count"))
		.executeTakeFirst();

	const totalCount =
		typeof countResult?.count === "string"
			? Number.parseInt(countResult.count, 10)
			: Number(countResult?.count ?? 0);

	// Get paginated rows using builder
	const rows = await db
		.withSchema(schemaName)
		.selectFrom(tableName)
		.selectAll()
		.limit(limit)
		.offset(offset)
		.execute();

	return {
		rows: rows as Array<Record<string, unknown>>,
		totalCount,
	};
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
