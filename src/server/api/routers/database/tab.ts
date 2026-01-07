import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { tabService } from "~/server/services/tab-service";

export const tabRouter = createTRPCRouter({
	/**
	 * List all tabs for a connection
	 */
	listTabs: protectedProcedure
		.input(z.object({ connectionId: z.number() }))
		.query(async ({ ctx, input }) => {
			return tabService.listTabs(ctx.db, ctx.userId, input.connectionId);
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
			return tabService.createTab(ctx.db, ctx.userId, input);
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
			const { id, ...data } = input;
			return tabService.updateTab(ctx.db, ctx.userId, id, data);
		}),

	/**
	 * Delete a query tab
	 */
	deleteTab: protectedProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			return tabService.deleteTab(ctx.db, ctx.userId, input.id);
		}),
});
