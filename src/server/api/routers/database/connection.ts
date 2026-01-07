import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { connectionPool } from "~/server/db/connection-pool";
import { getValidatedConnection } from "~/server/db/connection-utils";
import {
	getTables,
	testConnection as testConnectionUtil,
} from "~/server/db/query-utils";
import { databaseConnections } from "~/server/db/schema";
import { connectionService } from "~/server/services/connection-service";

// Validation schemas
export const connectionStringConnectionSchema = z.object({
	name: z.string().min(1, "Connection name is required"),
	connectionString: z.string().min(1, "Connection string is required"),
});

export const manualConnectionSchema = z.object({
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

export const connectionInputSchema = z.union([
	connectionStringConnectionSchema.extend({
		connectionType: z.literal("connection_string"),
	}),
	manualConnectionSchema.extend({
		connectionType: z.literal("manual"),
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
				const connection = await connectionService.createConnection(
					ctx.db,
					ctx.userId,
					input
				);

				if (!connection) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to create connection",
					});
				}

				// Test the connection before returning
				try {
					const db = await connectionPool.getConnection(connection);
					const isConnected = await testConnectionUtil(db);

					if (!isConnected) {
						throw new Error("Connection test failed");
					}
				} catch (_error) {
					// Clean up if connection failed
					await connectionService.deleteConnection(
						ctx.db,
						ctx.userId,
						connection.id
					);

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
	 * Test connection credentials without saving
	 * Returns success status and latency for UI feedback
	 */
	testConnectionCredentials: protectedProcedure
		.input(connectionInputSchema)
		.mutation(async ({ input }) => {
			const startTime = Date.now();

			try {
				let connectionString: string;

				if (input.connectionType === "connection_string") {
					connectionString = input.connectionString;
				} else {
					// Build connection string from manual input
					const sslParam = input.ssl ? `?sslmode=${input.sslMode}` : "";
					// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
					connectionString = `postgresql://${encodeURIComponent(input.username)}:${encodeURIComponent(input.password)}@${input.host}:${input.port}/${input.database}${sslParam}`;
				}

				// Import postgres dynamically to test the connection
				const { default: postgres } = await import("postgres");
				const testDb = postgres(connectionString, {
					max: 1,
					idle_timeout: 5,
					connect_timeout: 10,
				});

				// Execute a simple query to verify connection
				await testDb`SELECT 1 as test`;
				await testDb.end();

				const latencyMs = Date.now() - startTime;

				return {
					success: true,
					message: "Connection successful",
					latencyMs,
				};
			} catch (error) {
				const latencyMs = Date.now() - startTime;

				return {
					success: false,
					message: error instanceof Error ? error.message : "Failed to connect",
					latencyMs,
				};
			}
		}),

	/**
	 * Get all connections for the current user
	 */
	listConnections: protectedProcedure.query(async ({ ctx }) => {
		const connections = await connectionService.listConnections(
			ctx.db,
			ctx.userId
		);

		return connections.map(conn => ({
			id: conn.id,
			name: conn.name,
			connectionType: conn.connectionType as "manual" | "connection_string",
			host: conn.host,
			port: conn.port,
			username: conn.username,
			database: conn.database,
			ssl: conn.ssl,
			sslMode: conn.sslMode,
			isActive: conn.isActive,
			createdAt: conn.createdAt,
			lastUsedAt: conn.lastUsedAt,
			// Settings
			color: conn.color,
			defaultSchema: conn.defaultSchema,
			queryTimeoutSeconds: conn.queryTimeoutSeconds,
			rowLimit: conn.rowLimit,
			isReadOnly: conn.isReadOnly,
			confirmDestructive: conn.confirmDestructive,
			keepAliveSeconds: conn.keepAliveSeconds,
			autoReconnect: conn.autoReconnect,
		}));
	}),

	/**
	 * Get a specific connection
	 */
	getConnection: protectedProcedure
		.input(z.object({ id: z.number() }))
		.query(async ({ ctx, input }) => {
			return connectionService.getConnection(ctx.db, ctx.userId, input.id);
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

			if (!connection) throw new TRPCError({ code: "NOT_FOUND" });

			try {
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
				connectionType: z.enum(["manual", "connection_string"]).optional(),
				host: z.string().optional(),
				port: z.number().optional(),
				username: z.string().optional(),
				password: z.string().optional(),
				database: z.string().optional(),
				ssl: z.boolean().optional(),
				sslMode: z
					.enum(["disable", "prefer", "require", "verify-full"])
					.optional(),
				connectionString: z.string().optional(),
				// Settings
				color: z.string().optional(),
				defaultSchema: z.string().nullable().optional(),
				queryTimeoutSeconds: z.number().min(1).max(3600).optional(),
				rowLimit: z.number().min(1).max(10000).optional(),
				isReadOnly: z.boolean().optional(),
				confirmDestructive: z.boolean().optional(),
				keepAliveSeconds: z.number().min(0).max(3600).optional(),
				autoReconnect: z.boolean().optional(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			const updated = await connectionService.updateConnection(
				ctx.db,
				ctx.userId,
				id,
				data
			);

			// Perform connection test if connection details changed (heuristic)
			const connectionDetailsChanged =
				input.host ||
				input.port ||
				input.database ||
				input.username ||
				input.password ||
				input.connectionString;

			if (connectionDetailsChanged && updated?.isActive) {
				try {
					const db = await connectionPool.getConnection(updated);
					const isConnected = await testConnectionUtil(db);
					if (!isConnected) throw new Error("Connection test failed");
				} catch (_error) {
					// If test fails, mark inactive? or throw?
					// Reverting is hard. Let's mark inactive.
					await connectionService.updateConnection(ctx.db, ctx.userId, id, {
						isActive: false,
					});

					throw new TRPCError({
						code: "BAD_REQUEST",
						message:
							"Connection updated but connection test failed. Connection marked inactive.",
					});
				}
			}

			return [updated];
		}),

	/**
	 * Delete a database connection
	 */
	deleteConnection: protectedProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			await connectionService.deleteConnection(ctx.db, ctx.userId, input.id);
			return { success: true };
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
			return connectionService.reconnectConnection(ctx, input.id);
		}),
});
