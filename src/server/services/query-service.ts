import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";

import { getValidatedConnection } from "~/server/db/connection-utils";
import { executeQuery } from "~/server/db/query-utils";
import { databaseConnections, savedQueries } from "~/server/db/schema";

type Db = typeof import("~/server/db").db;

export interface CreateSavedQueryInput {
	connectionId: number;
	name: string;
	query: string;
	tabId?: number | null;
}

export interface UpdateSavedQueryInput {
	name?: string;
	query?: string;
	tabId?: number | null;
	position?: number;
}

export const queryService = {
	async createSavedQuery(db: Db, userId: string, input: CreateSavedQueryInput) {
		// Validate connection existence for the user
		const connection = await db.query.databaseConnections.findFirst({
			where: and(
				eq(databaseConnections.id, input.connectionId),
				eq(databaseConnections.userId, userId)
			),
		});

		if (!connection) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Connection not found",
			});
		}

		const result = await db
			.insert(savedQueries)
			.values({
				userId: userId,
				connectionId: input.connectionId,
				name: input.name,
				query: input.query,
				tabId: input.tabId,
			})
			.returning();

		return result[0];
	},

	async listSavedQueries(db: Db, userId: string, connectionId: number) {
		return db
			.select()
			.from(savedQueries)
			.where(
				and(
					eq(savedQueries.connectionId, connectionId),
					eq(savedQueries.userId, userId)
				)
			)
			.orderBy(desc(savedQueries.updatedAt));
	},

	async getSavedQuery(db: Db, userId: string, id: number) {
		const query = await db.query.savedQueries.findFirst({
			where: and(eq(savedQueries.id, id), eq(savedQueries.userId, userId)),
		});

		if (!query) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Query not found",
			});
		}

		return query;
	},

	async updateSavedQuery(
		db: Db,
		userId: string,
		id: number,
		input: UpdateSavedQueryInput
	) {
		const result = await db
			.update(savedQueries)
			.set({
				name: input.name,
				query: input.query,
				tabId: input.tabId,
				position: input.position,
			})
			.where(and(eq(savedQueries.id, id), eq(savedQueries.userId, userId)))
			.returning();

		if (!result.length) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Query not found",
			});
		}

		return result[0];
	},

	async deleteSavedQuery(db: Db, userId: string, id: number) {
		const result = await db
			.delete(savedQueries)
			.where(and(eq(savedQueries.id, id), eq(savedQueries.userId, userId)))
			.returning();

		if (!result.length) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Query not found",
			});
		}

		return { success: true };
	},

	async executeSavedQuery(ctx: { db: Db; userId: string }, id: number) {
		const savedQuery = await ctx.db.query.savedQueries.findFirst({
			where: and(eq(savedQueries.id, id), eq(savedQueries.userId, ctx.userId)),
		});

		if (!savedQuery) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Query not found",
			});
		}

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

		try {
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
				.where(eq(savedQueries.id, id))
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
	},

	async executeAndSaveQuery(
		ctx: { db: Db; userId: string },
		input: CreateSavedQueryInput
	) {
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

		try {
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
	},

	async executeQuery(
		ctx: { db: Db; userId: string },
		connectionId: number,
		query: string
	) {
		const connection = await ctx.db.query.databaseConnections.findFirst({
			where: and(
				eq(databaseConnections.id, connectionId),
				eq(databaseConnections.userId, ctx.userId)
			),
			columns: {
				isReadOnly: true,
				queryTimeoutSeconds: true,
				rowLimit: true,
			},
		});

		try {
			const db = await getValidatedConnection(ctx, connectionId);
			return await executeQuery(db, query, {
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
	},
};
