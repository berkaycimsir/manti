import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { getValidatedConnection } from "~/server/db/connection-utils";
import {
	getSchemas,
	getTableColumns,
	getTableData,
	getTables,
} from "~/server/db/query-utils";
import { databaseConnections } from "~/server/db/schema";

export const tableRouter = createTRPCRouter({
	/**
	 * Get all tables from a database connection
	 */
	getTables: protectedProcedure
		.input(z.object({ connectionId: z.number() }))
		.query(async ({ ctx, input }) => {
			try {
				const db = await getValidatedConnection(ctx, input.connectionId);
				return await getTables(db);
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message:
						error instanceof Error ? error.message : "Failed to fetch tables",
				});
			}
		}),

	/**
	 * Get all schemas from a database
	 */
	getSchemas: protectedProcedure
		.input(z.object({ connectionId: z.number() }))
		.query(async ({ ctx, input }) => {
			try {
				const db = await getValidatedConnection(ctx, input.connectionId);
				return await getSchemas(db);
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message:
						error instanceof Error ? error.message : "Failed to fetch schemas",
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
			})
		)
		.query(async ({ ctx, input }) => {
			try {
				const db = await getValidatedConnection(ctx, input.connectionId);
				const columns = await getTableColumns(
					db,
					input.tableName,
					input.schemaName
				);
				return columns;
			} catch (error) {
				if (error instanceof TRPCError) throw error;
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
			})
		)
		.query(async ({ ctx, input }) => {
			try {
				const connection = await ctx.db.query.databaseConnections.findFirst({
					where: and(
						eq(databaseConnections.id, input.connectionId),
						eq(databaseConnections.userId, ctx.userId)
					),
					columns: {
						queryTimeoutSeconds: true,
						rowLimit: true,
					},
				});

				const db = await getValidatedConnection(ctx, input.connectionId);
				const effectiveLimit = connection?.rowLimit
					? Math.min(input.limit, connection.rowLimit)
					: input.limit;

				const data = await getTableData(
					db,
					input.tableName,
					input.schemaName,
					effectiveLimit,
					input.offset,
					{ queryTimeoutSeconds: connection?.queryTimeoutSeconds ?? 60 }
				);
				return data;
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message:
						error instanceof Error
							? error.message
							: "Failed to fetch table data",
				});
			}
		}),
});
