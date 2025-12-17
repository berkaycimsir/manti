import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
	databaseConnections,
	savedQueries,
	columnTransformations,
	columnFilters,
	type databaseConnections as DatabaseConnectionsType,
} from "~/server/db/schema";
import {
	encryptSensitiveData,
	decryptSensitiveData,
} from "~/server/db/encryption";
import { connectionPool } from "~/server/db/connection-pool";
import {
	getTables,
	getTableColumns,
	getTableData,
	executeQuery,
	getSchemas,
	testConnection,
} from "~/server/db/query-utils";

type DatabaseConnection = typeof DatabaseConnectionsType.$inferSelect;

// Validation schemas
const connectionStringConnectionSchema = z.object({
	name: z.string().min(1, "Connection name is required"),
	connectionString: z.string().min(1, "Connection string is required"),
});

const manualConnectionSchema = z.object({
	name: z.string().min(1, "Connection name is required"),
	host: z.string().min(1, "Host is required"),
	port: z.number().min(1).max(65535, "Invalid port number"),
	username: z.string().min(1, "Username is required"),
	password: z.string(),
	database: z.string().min(1, "Database name is required"),
	ssl: z.boolean().default(false),
	sslMode: z
		.enum(["disable", "prefer", "require", "verify-full"])
		.default("disable"),
});

const connectionInputSchema = z.union([
	connectionStringConnectionSchema.extend({
		connectionType: z.literal("connection_string"),
	}),
	manualConnectionSchema.extend({
		connectionType: z.literal("manual"),
	}),
]);

export const databaseRouter = createTRPCRouter({
	// ==================== CONNECTION PROCEDURES ====================

	/**
	 * Create a new database connection
	 */
	createConnection: protectedProcedure
		.input(connectionInputSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				let encryptedPassword: string | null = null;
				let encryptedConnectionString: string | null = null;

				if (input.connectionType === "connection_string") {
					encryptedConnectionString = encryptSensitiveData(
						input.connectionString,
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
						host: input.connectionType === "manual" ? input.host : null,
						port: input.connectionType === "manual" ? input.port : null,
						username: input.connectionType === "manual" ? input.username : null,
						password: encryptedPassword,
						database: input.connectionType === "manual" ? input.database : null,
						ssl: input.connectionType === "manual" ? input.ssl : false,
						sslMode:
							input.connectionType === "manual" ? input.sslMode : "disable",
					})
					.returning();

				if (!result.length) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to create connection",
					});
				}

				const connection = result.at(0);

				if (!connection) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to create connection",
					});
				}

				// Test the connection before returning
				const db = await connectionPool.getConnection(connection);
				const isConnected = await testConnection(db);

				if (!isConnected) {
					await ctx.db
						.delete(databaseConnections)
						.where(eq(databaseConnections.id, connection.id));
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Failed to connect to the database",
					});
				}

				return connection;
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message:
						error instanceof Error
							? error.message
							: "Failed to create connection",
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
						eq(databaseConnections.userId, ctx.userId),
					),
				);

			if (!connection.length) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Connection not found",
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
			const connections = await ctx.db
				.select()
				.from(databaseConnections)
				.where(
					and(
						eq(databaseConnections.id, input.connectionId),
						eq(databaseConnections.userId, ctx.userId),
					),
				);

			const connection = connections.at(0);
			if (!connection) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Connection not found",
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
					code: "INTERNAL_SERVER_ERROR",
					message:
						error instanceof Error
							? error.message
							: "Failed to fetch connection stats",
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
			}),
		)
		.mutation(async ({ ctx, input }) => {
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
						eq(databaseConnections.userId, ctx.userId),
					),
				);

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
						eq(databaseConnections.userId, ctx.userId),
					),
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
						eq(databaseConnections.userId, ctx.userId),
					),
				);

			const connection = connections.at(0);
			if (!connection) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Connection not found",
				});
			}

			try {
				const db = await connectionPool.getConnection(connection);
				const isConnected = await testConnection(db);
				return { connected: isConnected };
			} catch (error) {
				return {
					connected: false,
					error: error instanceof Error ? error.message : "Unknown error",
				};
			}
		}),

	/**
	 * Reconnect an inactive database connection
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
						eq(databaseConnections.userId, ctx.userId),
					),
				);

			const connection = connections.at(0);
			if (!connection) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Connection not found",
				});
			}

			try {
				const db = await connectionPool.getConnection(connection);
				const isConnected = await testConnection(db);

				if (!isConnected) {
					throw new Error("Connection test failed");
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
					code: "BAD_REQUEST",
					message:
						error instanceof Error
							? error.message
							: "Failed to reconnect to database",
				});
			}
		}),

	// ==================== TABLE PROCEDURES ====================

	/**
	 * Get all tables from a database connection
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
						eq(databaseConnections.userId, ctx.userId),
					),
				);

			const connection = connections.at(0);
			if (!connection) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Connection not found",
				});
			}

			try {
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
					code: "INTERNAL_SERVER_ERROR",
					message:
						error instanceof Error ? error.message : "Failed to fetch tables",
				});
			}
		}),

	/**
	 * Get columns from a table
	 */
	getTableColumns: protectedProcedure
		.input(
			z.object({
				connectionId: z.number(),
				tableName: z.string(),
				schemaName: z.string().default("public"),
			}),
		)
		.query(async ({ ctx, input }) => {
			const connections = await ctx.db
				.select()
				.from(databaseConnections)
				.where(
					and(
						eq(databaseConnections.id, input.connectionId),
						eq(databaseConnections.userId, ctx.userId),
					),
				);

			const connection = connections.at(0);
			if (!connection) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Connection not found",
				});
			}

			try {
				const db = await connectionPool.getConnection(connection);
				const columns = await getTableColumns(
					db,
					input.tableName,
					input.schemaName,
				);

				if (!connection.isActive) {
					await ctx.db
						.update(databaseConnections)
						.set({ isActive: true, updatedAt: new Date() })
						.where(eq(databaseConnections.id, input.connectionId));
				}

				return columns;
			} catch (error) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message:
						error instanceof Error
							? error.message
							: "Failed to fetch table columns",
				});
			}
		}),

	/**
	 * Get data from a table with pagination
	 */
	getTableData: protectedProcedure
		.input(
			z.object({
				connectionId: z.number(),
				tableName: z.string(),
				schemaName: z.string().default("public"),
				limit: z.number().min(1).max(1000).default(100),
				offset: z.number().min(0).default(0),
			}),
		)
		.query(async ({ ctx, input }) => {
			const connections = await ctx.db
				.select()
				.from(databaseConnections)
				.where(
					and(
						eq(databaseConnections.id, input.connectionId),
						eq(databaseConnections.userId, ctx.userId),
					),
				);

			const connection = connections.at(0);
			if (!connection) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Connection not found",
				});
			}

			try {
				const db = await connectionPool.getConnection(connection);
				const data = await getTableData(
					db,
					input.tableName,
					input.schemaName,
					input.limit,
					input.offset,
				);

				if (!connection.isActive) {
					await ctx.db
						.update(databaseConnections)
						.set({ isActive: true, updatedAt: new Date() })
						.where(eq(databaseConnections.id, input.connectionId));
				}

				return data;
			} catch (error) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message:
						error instanceof Error
							? error.message
							: "Failed to fetch table data",
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
						eq(databaseConnections.userId, ctx.userId),
					),
				);

			const connection = connections.at(0);
			if (!connection) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Connection not found",
				});
			}

			try {
				const db = await connectionPool.getConnection(connection);
				return await getSchemas(db);
			} catch (error) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message:
						error instanceof Error ? error.message : "Failed to fetch schemas",
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
				query: z.string().min(1, "Query is required"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const connections = await ctx.db
				.select()
				.from(databaseConnections)
				.where(
					and(
						eq(databaseConnections.id, input.connectionId),
						eq(databaseConnections.userId, ctx.userId),
					),
				);

			const connection = connections.at(0);
			if (!connection) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Connection not found",
				});
			}

			try {
				const db = await connectionPool.getConnection(connection);
				return await executeQuery(db, input.query);
			} catch (error) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message:
						error instanceof Error ? error.message : "Query execution failed",
				});
			}
		}),

	// ==================== SAVED QUERIES PROCEDURES ====================

	/**
	 * Create a new saved query
	 */
	createSavedQuery: protectedProcedure
		.input(
			z.object({
				connectionId: z.number(),
				name: z.string().min(1, "Query name is required"),
				query: z.string().min(1, "Query is required"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const connections = await ctx.db
				.select()
				.from(databaseConnections)
				.where(
					and(
						eq(databaseConnections.id, input.connectionId),
						eq(databaseConnections.userId, ctx.userId),
					),
				);

			if (!connections.length) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Connection not found",
				});
			}

			const result = await ctx.db
				.insert(savedQueries)
				.values({
					userId: ctx.userId,
					connectionId: input.connectionId,
					name: input.name,
					query: input.query,
				})
				.returning();

			return result[0];
		}),

	/**
	 * Get all saved queries for a connection
	 */
	listSavedQueries: protectedProcedure
		.input(z.object({ connectionId: z.number() }))
		.query(async ({ ctx, input }) => {
			const queries = await ctx.db
				.select()
				.from(savedQueries)
				.where(
					and(
						eq(savedQueries.connectionId, input.connectionId),
						eq(savedQueries.userId, ctx.userId),
					),
				)
				.orderBy(desc(savedQueries.updatedAt));

			return queries;
		}),

	/**
	 * Get a specific saved query
	 */
	getSavedQuery: protectedProcedure
		.input(z.object({ id: z.number() }))
		.query(async ({ ctx, input }) => {
			const queries = await ctx.db
				.select()
				.from(savedQueries)
				.where(
					and(
						eq(savedQueries.id, input.id),
						eq(savedQueries.userId, ctx.userId),
					),
				);

			if (!queries.length) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Query not found",
				});
			}

			return queries[0];
		}),

	/**
	 * Update a saved query
	 */
	updateSavedQuery: protectedProcedure
		.input(
			z.object({
				id: z.number(),
				name: z.string().min(1).optional(),
				query: z.string().min(1).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const result = await ctx.db
				.update(savedQueries)
				.set({
					name: input.name,
					query: input.query,
				})
				.where(
					and(
						eq(savedQueries.id, input.id),
						eq(savedQueries.userId, ctx.userId),
					),
				)
				.returning();

			if (!result.length) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Query not found",
				});
			}

			return result[0];
		}),

	/**
	 * Delete a saved query
	 */
	deleteSavedQuery: protectedProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const result = await ctx.db
				.delete(savedQueries)
				.where(
					and(
						eq(savedQueries.id, input.id),
						eq(savedQueries.userId, ctx.userId),
					),
				)
				.returning();

			if (!result.length) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Query not found",
				});
			}

			return { success: true };
		}),

	/**
	 * Execute a saved query and update its result
	 */
	executeSavedQuery: protectedProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const queries = await ctx.db
				.select()
				.from(savedQueries)
				.where(
					and(
						eq(savedQueries.id, input.id),
						eq(savedQueries.userId, ctx.userId),
					),
				);

			if (!queries.length) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Query not found",
				});
			}

			const savedQuery = queries.at(0);
			if (!savedQuery) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Query not found",
				});
			}

			const connections = await ctx.db
				.select()
				.from(databaseConnections)
				.where(
					and(
						eq(databaseConnections.id, savedQuery.connectionId),
						eq(databaseConnections.userId, ctx.userId),
					),
				);

			if (!connections.length) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Connection not found",
				});
			}

			const connection = connections.at(0);
			if (!connection) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Connection not found",
				});
			}

			try {
				const startTime = Date.now();
				const db = await connectionPool.getConnection(connection);
				const result = await executeQuery(db, savedQuery.query);
				const executionTime = Date.now() - startTime;

				const updated = await ctx.db
					.update(savedQueries)
					.set({
						lastResult: result.rows as unknown as Record<string, unknown>,
						lastExecutedAt: new Date(),
						executionTimeMs: executionTime,
						rowCount: result.rowCount,
					})
					.where(eq(savedQueries.id, input.id))
					.returning();

				return {
					...updated[0],
					result,
					executionTimeMs: executionTime,
				};
			} catch (error) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message:
						error instanceof Error ? error.message : "Query execution failed",
				});
			}
		}),

	/**
	 * Execute a query and save it
	 */
	executeAndSaveQuery: protectedProcedure
		.input(
			z.object({
				connectionId: z.number(),
				name: z.string().min(1, "Query name is required"),
				query: z.string().min(1, "Query is required"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const connections = await ctx.db
				.select()
				.from(databaseConnections)
				.where(
					and(
						eq(databaseConnections.id, input.connectionId),
						eq(databaseConnections.userId, ctx.userId),
					),
				);

			if (!connections.length) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Connection not found",
				});
			}

			const connection = connections.at(0);
			if (!connection) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Connection not found",
				});
			}

			try {
				const startTime = Date.now();
				const db = await connectionPool.getConnection(connection);
				const result = await executeQuery(db, input.query);
				const executionTime = Date.now() - startTime;

				const saved = await ctx.db
					.insert(savedQueries)
					.values({
						userId: ctx.userId,
						connectionId: input.connectionId,
						name: input.name,
						query: input.query,
						lastResult: result.rows as unknown as Record<string, unknown>,
						lastExecutedAt: new Date(),
						executionTimeMs: executionTime,
						rowCount: result.rowCount,
					})
					.returning();

				return {
					...saved[0],
					result,
					executionTimeMs: executionTime,
				};
			} catch (error) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message:
						error instanceof Error ? error.message : "Query execution failed",
				});
			}
		}),

	// ==================== COLUMN TRANSFORMATIONS PROCEDURES ====================

	/**
	 * List all column transformations for a table
	 */
	listColumnTransformations: protectedProcedure
		.input(
			z.object({
				connectionId: z.number(),
				tableName: z.string(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const transformations = await ctx.db
				.select()
				.from(columnTransformations)
				.where(
					and(
						eq(columnTransformations.userId, ctx.userId),
						eq(columnTransformations.connectionId, input.connectionId),
						eq(columnTransformations.tableName, input.tableName),
					),
				);

			return transformations;
		}),

	/**
	 * Create a new column transformation
	 */
	createColumnTransformation: protectedProcedure
		.input(
			z.object({
				connectionId: z.number(),
				tableName: z.string(),
				columnName: z.string(),
				transformationType: z.enum([
					"date",
					"number",
					"boolean",
					"json",
					"truncate",
					"mask",
					"uppercase",
					"lowercase",
					"capitalize",
					"custom",
				]),
				options: z.record(z.unknown()).optional(),
				isEnabled: z.boolean().default(true),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Check if transformation already exists for this column
			const existing = await ctx.db
				.select()
				.from(columnTransformations)
				.where(
					and(
						eq(columnTransformations.userId, ctx.userId),
						eq(columnTransformations.connectionId, input.connectionId),
						eq(columnTransformations.tableName, input.tableName),
						eq(columnTransformations.columnName, input.columnName),
					),
				);

			if (existing.length > 0) {
				const existingTransformation = existing.at(0);
				if (!existingTransformation) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to find existing transformation",
					});
				}
				// Update existing transformation
				const updated = await ctx.db
					.update(columnTransformations)
					.set({
						transformationType: input.transformationType,
						options: input.options,
						isEnabled: input.isEnabled,
					})
					.where(eq(columnTransformations.id, existingTransformation.id))
					.returning();

				return updated[0];
			}

			// Create new transformation
			const result = await ctx.db
				.insert(columnTransformations)
				.values({
					userId: ctx.userId,
					connectionId: input.connectionId,
					tableName: input.tableName,
					columnName: input.columnName,
					transformationType: input.transformationType,
					options: input.options,
					isEnabled: input.isEnabled,
				})
				.returning();

			return result[0];
		}),

	/**
	 * Update a column transformation
	 */
	updateColumnTransformation: protectedProcedure
		.input(
			z.object({
				id: z.number(),
				transformationType: z
					.enum([
						"date",
						"number",
						"boolean",
						"json",
						"truncate",
						"mask",
						"uppercase",
						"lowercase",
						"capitalize",
						"custom",
					])
					.optional(),
				options: z.record(z.unknown()).optional(),
				isEnabled: z.boolean().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const result = await ctx.db
				.update(columnTransformations)
				.set({
					...(input.transformationType && {
						transformationType: input.transformationType,
					}),
					...(input.options !== undefined && { options: input.options }),
					...(input.isEnabled !== undefined && { isEnabled: input.isEnabled }),
				})
				.where(
					and(
						eq(columnTransformations.id, input.id),
						eq(columnTransformations.userId, ctx.userId),
					),
				)
				.returning();

			if (!result.length) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Transformation not found",
				});
			}

			return result[0];
		}),

	/**
	 * Delete a column transformation
	 */
	deleteColumnTransformation: protectedProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const result = await ctx.db
				.delete(columnTransformations)
				.where(
					and(
						eq(columnTransformations.id, input.id),
						eq(columnTransformations.userId, ctx.userId),
					),
				)
				.returning();

			if (!result.length) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Transformation not found",
				});
			}

			return { success: true };
		}),

	// ==================== COLUMN FILTERS PROCEDURES ====================

	/**
	 * List all column filters for a table
	 */
	listColumnFilters: protectedProcedure
		.input(
			z.object({
				connectionId: z.number(),
				tableName: z.string(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const filters = await ctx.db
				.select()
				.from(columnFilters)
				.where(
					and(
						eq(columnFilters.userId, ctx.userId),
						eq(columnFilters.connectionId, input.connectionId),
						eq(columnFilters.tableName, input.tableName),
					),
				);

			return filters;
		}),

	/**
	 * Create a new column filter
	 */
	createColumnFilter: protectedProcedure
		.input(
			z.object({
				connectionId: z.number(),
				tableName: z.string(),
				columnName: z.string(),
				filterType: z.enum([
					"contains",
					"equals",
					"not_equals",
					"starts_with",
					"ends_with",
					"greater_than",
					"less_than",
					"between",
					"is_null",
					"is_not_null",
					"in_list",
				]),
				filterValue: z.string().nullable().optional(),
				filterValueEnd: z.string().nullable().optional(),
				isEnabled: z.boolean().default(true),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const result = await ctx.db
				.insert(columnFilters)
				.values({
					userId: ctx.userId,
					connectionId: input.connectionId,
					tableName: input.tableName,
					columnName: input.columnName,
					filterType: input.filterType,
					filterValue: input.filterValue,
					filterValueEnd: input.filterValueEnd,
					isEnabled: input.isEnabled,
				})
				.returning();

			return result[0];
		}),

	/**
	 * Update a column filter
	 */
	updateColumnFilter: protectedProcedure
		.input(
			z.object({
				id: z.number(),
				filterType: z
					.enum([
						"contains",
						"equals",
						"not_equals",
						"starts_with",
						"ends_with",
						"greater_than",
						"less_than",
						"between",
						"is_null",
						"is_not_null",
						"in_list",
					])
					.optional(),
				filterValue: z.string().nullable().optional(),
				filterValueEnd: z.string().nullable().optional(),
				isEnabled: z.boolean().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...updates } = input;

			const result = await ctx.db
				.update(columnFilters)
				.set(updates)
				.where(
					and(eq(columnFilters.id, id), eq(columnFilters.userId, ctx.userId)),
				)
				.returning();

			if (!result.length) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Filter not found",
				});
			}

			return result[0];
		}),

	/**
	 * Delete a column filter
	 */
	deleteColumnFilter: protectedProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const result = await ctx.db
				.delete(columnFilters)
				.where(
					and(
						eq(columnFilters.id, input.id),
						eq(columnFilters.userId, ctx.userId),
					),
				)
				.returning();

			if (!result.length) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Filter not found",
				});
			}

			return { success: true };
		}),
});
