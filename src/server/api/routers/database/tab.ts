import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { databaseConnections, queryTabs } from "~/server/db/schema";

export const tabRouter = createTRPCRouter({
	/**
	 * List all tabs for a connection
	 */
	listTabs: protectedProcedure
		.input(z.object({ connectionId: z.number() }))
		.query(async ({ ctx, input }) => {
			const tabs = await ctx.db
				.select()
				.from(queryTabs)
				.where(
					and(
						eq(queryTabs.connectionId, input.connectionId),
						eq(queryTabs.userId, ctx.userId)
					)
				)
				.orderBy(queryTabs.position);

			return tabs;
		}),

	/**
	 * Create a new query tab
	 */
	createTab: protectedProcedure
		.input(
			z.object({
				connectionId: z.number(),
				name: z.string().min(1, "Tab name is required"),
			})
		)
		.mutation(async ({ ctx, input }) => {
			// Check connection exists
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

			// Get max position to append
			const maxPos = await ctx.db
				.select({ value: queryTabs.position })
				.from(queryTabs)
				.where(
					and(
						eq(queryTabs.connectionId, input.connectionId),
						eq(queryTabs.userId, ctx.userId)
					)
				)
				.orderBy(desc(queryTabs.position))
				.limit(1);

			const position = (maxPos[0]?.value ?? -1) + 1;

			const result = await ctx.db
				.insert(queryTabs)
				.values({
					userId: ctx.userId,
					connectionId: input.connectionId,
					name: input.name,
					position,
				})
				.returning();

			return result[0];
		}),

	/**
	 * Update a query tab (rename or move)
	 */
	updateTab: protectedProcedure
		.input(
			z.object({
				id: z.number(),
				name: z.string().min(1).optional(),
				position: z.number().optional(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			// Only include defined fields in the update
			const updateData: { name?: string; position?: number; updatedAt: Date } =
				{
					updatedAt: new Date(),
				};

			if (input.name !== undefined) {
				updateData.name = input.name;
			}
			if (input.position !== undefined) {
				updateData.position = input.position;
			}

			const result = await ctx.db
				.update(queryTabs)
				.set(updateData)
				.where(
					and(eq(queryTabs.id, input.id), eq(queryTabs.userId, ctx.userId))
				)
				.returning();

			if (!result.length) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Tab not found",
				});
			}

			return result[0];
		}),

	/**
	 * Delete a query tab
	 */
	deleteTab: protectedProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			const result = await ctx.db
				.delete(queryTabs)
				.where(
					and(eq(queryTabs.id, input.id), eq(queryTabs.userId, ctx.userId))
				)
				.returning();

			if (!result.length) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Tab not found",
				});
			}

			return { success: true };
		}),
});
