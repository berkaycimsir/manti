import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { columnRulesService } from "~/server/services/column-rules-service";

export const tableConfigRouter = createTRPCRouter({
	// ==================== GLOBAL TRANSFORMATIONS ====================

	/**
	 * List all global column transformations for a connection (tableName IS NULL)
	 */
	listGlobalTransformations: protectedProcedure
		.input(z.object({ connectionId: z.number() }))
		.query(async ({ ctx, input }) => {
			return columnRulesService.listGlobalTransformations(
				ctx.db,
				ctx.userId,
				input.connectionId
			);
		}),

	/**
	 * Create a global column transformation (tableName = null)
	 */
	createGlobalTransformation: protectedProcedure
		.input(
			z.object({
				connectionId: z.number(),
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
			})
		)
		.mutation(async ({ ctx, input }) => {
			return columnRulesService.createTransformation(ctx.db, ctx.userId, {
				...input,
				tableName: null,
			});
		}),

	// ==================== GLOBAL FILTERS ====================

	/**
	 * List all global column filters for a connection (tableName IS NULL)
	 */
	listGlobalFilters: protectedProcedure
		.input(z.object({ connectionId: z.number() }))
		.query(async ({ ctx, input }) => {
			return columnRulesService.listGlobalFilters(
				ctx.db,
				ctx.userId,
				input.connectionId
			);
		}),

	/**
	 * Create a global column filter (tableName = null)
	 */
	createGlobalFilter: protectedProcedure
		.input(
			z.object({
				connectionId: z.number(),
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
			})
		)
		.mutation(async ({ ctx, input }) => {
			return columnRulesService.createFilter(ctx.db, ctx.userId, {
				...input,
				tableName: null,
			});
		}),

	// ==================== COLUMN TRANSFORMATIONS ====================

	/**
	 * List all column transformations for a table
	 */
	listColumnTransformations: protectedProcedure
		.input(
			z.object({
				connectionId: z.number(),
				tableName: z.string(),
			})
		)
		.query(async ({ ctx, input }) => {
			return columnRulesService.listTableTransformations(
				ctx.db,
				ctx.userId,
				input.connectionId,
				input.tableName
			);
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
			})
		)
		.mutation(async ({ ctx, input }) => {
			return columnRulesService.createTransformation(ctx.db, ctx.userId, input);
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
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			return columnRulesService.updateTransformation(
				ctx.db,
				ctx.userId,
				id,
				data
			);
		}),

	/**
	 * Delete a column transformation
	 */
	deleteColumnTransformation: protectedProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			return columnRulesService.deleteTransformation(
				ctx.db,
				ctx.userId,
				input.id
			);
		}),

	// ==================== COLUMN FILTERS ====================

	/**
	 * List all column filters for a table
	 */
	listColumnFilters: protectedProcedure
		.input(
			z.object({
				connectionId: z.number(),
				tableName: z.string(),
			})
		)
		.query(async ({ ctx, input }) => {
			return columnRulesService.listTableFilters(
				ctx.db,
				ctx.userId,
				input.connectionId,
				input.tableName
			);
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
			})
		)
		.mutation(async ({ ctx, input }) => {
			return columnRulesService.createFilter(ctx.db, ctx.userId, input);
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
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			return columnRulesService.updateFilter(ctx.db, ctx.userId, id, data);
		}),

	/**
	 * Delete a column filter
	 */
	deleteColumnFilter: protectedProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			return columnRulesService.deleteFilter(ctx.db, ctx.userId, input.id);
		}),
});
