import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { getValidatedConnection } from "~/server/db/connection-utils";
import { executeQuery } from "~/server/db/query-utils";
import { databaseConnections, savedQueries } from "~/server/db/schema";

export const queryRouter = createTRPCRouter({
	/**
	 * Create a new saved query
	 */
	createSavedQuery: protectedProcedure
		.input(
			z.object({
				connectionId: z.number(),
				name: z.string().min(1, "Query name is required"),
				query: z.string().min(1, "Query is required"),
				tabId: z.number().nullable().optional(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			// Validate connection existence for the user
			const connection = await ctx.db.query.databaseConnections.findFirst({
				where: and(
					eq(databaseConnections.id, input.connectionId),
					eq(databaseConnections.userId, ctx.userId)
				),
			});

			if (!connection) {
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
					tabId: input.tabId,
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
						eq(savedQueries.userId, ctx.userId)
					)
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
			const query = await ctx.db.query.savedQueries.findFirst({
				where: and(
					eq(savedQueries.id, input.id),
					eq(savedQueries.userId, ctx.userId)
				),
			});

			if (!query) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Query not found",
				});
			}

			return query;
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
				tabId: z.number().nullable().optional(),
				position: z.number().optional(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const result = await ctx.db
				.update(savedQueries)
				.set({
					name: input.name,
					query: input.query,
					tabId: input.tabId,
					position: input.position,
				})
				.where(
					and(
						eq(savedQueries.id, input.id),
						eq(savedQueries.userId, ctx.userId)
					)
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
						eq(savedQueries.userId, ctx.userId)
					)
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
			const savedQuery = await ctx.db.query.savedQueries.findFirst({
				where: and(
					eq(savedQueries.id, input.id),
					eq(savedQueries.userId, ctx.userId)
				),
			});

			if (!savedQuery) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Query not found",
				});
			}

			try {
				const startTime = Date.now();
				const connection = await ctx.db.query.databaseConnections.findFirst({
					where: and(
						eq(databaseConnections.id, savedQuery.connectionId),
						eq(databaseConnections.userId, ctx.userId)
					),
					columns: {
						isReadOnly: true,
						queryTimeoutSeconds: true,
						rowLimit: true,
					},
				});

				const db = await getValidatedConnection(ctx, savedQuery.connectionId);

				const result = await executeQuery(db, savedQuery.query, {
					isReadOnly: connection?.isReadOnly ?? false,
					queryTimeoutSeconds: connection?.queryTimeoutSeconds ?? 60,
					rowLimit: connection?.rowLimit ?? 500,
				});
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
				tabId: z.number().nullable().optional(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			try {
				const startTime = Date.now();
				const connection = await ctx.db.query.databaseConnections.findFirst({
					where: and(
						eq(databaseConnections.id, input.connectionId),
						eq(databaseConnections.userId, ctx.userId)
					),
					columns: {
						isReadOnly: true,
						queryTimeoutSeconds: true,
						rowLimit: true,
					},
				});

				const db = await getValidatedConnection(ctx, input.connectionId);

				const result = await executeQuery(db, input.query, {
					isReadOnly: connection?.isReadOnly ?? false,
					queryTimeoutSeconds: connection?.queryTimeoutSeconds ?? 60,
					rowLimit: connection?.rowLimit ?? 500,
				});
				const executionTime = Date.now() - startTime;

				const saved = await ctx.db
					.insert(savedQueries)
					.values({
						userId: ctx.userId,
						connectionId: input.connectionId,
						name: input.name,
						query: input.query,
						tabId: input.tabId,
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

	/**
	 * Execute a raw SQL query (ad-hoc)
	 */
	executeQuery: protectedProcedure
		.input(
			z.object({
				connectionId: z.number(),
				query: z.string().min(1, "Query is required"),
			})
		)
		.mutation(async ({ ctx, input }) => {
			try {
				const connection = await ctx.db.query.databaseConnections.findFirst({
					where: and(
						eq(databaseConnections.id, input.connectionId),
						eq(databaseConnections.userId, ctx.userId)
					),
					columns: {
						isReadOnly: true,
						queryTimeoutSeconds: true,
						rowLimit: true,
					},
				});

				const db = await getValidatedConnection(ctx, input.connectionId);
				return await executeQuery(db, input.query, {
					isReadOnly: connection?.isReadOnly ?? false,
					queryTimeoutSeconds: connection?.queryTimeoutSeconds ?? 60,
					rowLimit: connection?.rowLimit ?? 500,
				});
			} catch (error) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message:
						error instanceof Error ? error.message : "Query execution failed",
				});
			}
		}),
});
