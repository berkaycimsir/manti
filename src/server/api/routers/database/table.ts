import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { tableService } from "~/server/services/table-service";

export const tableRouter = createTRPCRouter({
	/**
	 * Get all tables from a database connection
	 */
	getTables: protectedProcedure
		.input(z.object({ connectionId: z.number() }))
		.query(async ({ ctx, input }) => {
			try {
				return await tableService.getTables(ctx, input.connectionId);
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
				return await tableService.getSchemas(ctx, input.connectionId);
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
				return await tableService.getTableColumns(
					ctx,
					input.connectionId,
					input.tableName,
					input.schemaName
				);
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
				return await tableService.getTableData(
					ctx,
					input.connectionId,
					input.tableName,
					input.schemaName,
					input.limit,
					input.offset
				);
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

	/**
	 * Get common column names across all tables in a database.
	 * Returns column names that appear in 2+ tables (for global transformations/filters).
	 */
	getCommonColumns: protectedProcedure
		.input(z.object({ connectionId: z.number() }))
		.query(async ({ ctx, input }) => {
			try {
				return await tableService.getCommonColumns(ctx, input.connectionId);
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message:
						error instanceof Error ? error.message : "Failed to fetch columns",
				});
			}
		}),
});
