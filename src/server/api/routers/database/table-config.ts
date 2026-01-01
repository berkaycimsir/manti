import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { columnFilters, columnTransformations } from "~/server/db/schema";

export const tableConfigRouter = createTRPCRouter({
	// ==================== COLUMN TRANSFORMATIONS ====================

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

	// ==================== COLUMN FILTERS ====================

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
