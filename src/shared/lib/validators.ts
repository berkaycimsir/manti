/**
 * Shared Zod validators and schemas
 * Used across tRPC routers and form validation
 */
import { z } from "zod";

// ============================================================================
// Common ID validators
// ============================================================================

/**
 * Validates a positive integer ID
 */
export const idSchema = z.number().int().positive();

/**
 * Validates a connection ID
 */
export const connectionIdSchema = z.object({
	connectionId: idSchema,
});

// ============================================================================
// Database entity validators
// ============================================================================

/**
 * Validates table name
 */
export const tableNameSchema = z.string().min(1);

/**
 * Validates schema name (defaults to "public")
 */
export const schemaNameSchema = z.string().default("public");

/**
 * Validates column name
 */
export const columnNameSchema = z.string().min(1);

/**
 * Common input for table operations
 */
export const tableInputSchema = z.object({
	connectionId: idSchema,
	tableName: tableNameSchema,
	schemaName: schemaNameSchema,
});

/**
 * Pagination input schema
 */
export const paginationSchema = z.object({
	limit: z.number().int().min(1).max(1000).default(100),
	offset: z.number().int().min(0).default(0),
});

// ============================================================================
// Connection validators
// ============================================================================

/**
 * Connection host - validates common hosts including localhost
 */
export const hostSchema = z.string().min(1);

/**
 * Database port
 */
export const portSchema = z.number().int().min(1).max(65535);

/**
 * Database name
 */
export const databaseNameSchema = z.string().min(1);

/**
 * New connection input schema
 */
export const newConnectionSchema = z.object({
	name: z.string().min(1).max(100),
	host: hostSchema,
	port: portSchema.default(5432),
	database: databaseNameSchema,
	username: z.string().min(1),
	password: z.string().optional(),
	sslMode: z
		.enum(["disable", "require", "verify-ca", "verify-full"])
		.default("require"),
});

// ============================================================================
// Query validators
// ============================================================================

/**
 * SQL query string
 */
export const sqlQuerySchema = z.string().min(1);

/**
 * Query execution input
 */
export const executeQuerySchema = z.object({
	connectionId: idSchema,
	query: sqlQuerySchema,
});

// ============================================================================
// Type exports
// ============================================================================

export type ConnectionId = z.infer<typeof connectionIdSchema>;
export type TableInput = z.infer<typeof tableInputSchema>;
export type Pagination = z.infer<typeof paginationSchema>;
export type NewConnection = z.infer<typeof newConnectionSchema>;
export type ExecuteQuery = z.infer<typeof executeQuerySchema>;
