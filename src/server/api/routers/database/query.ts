import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { queryService } from "~/server/services/query-service";

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
			return queryService.createSavedQuery(ctx.db, ctx.userId, input);
		}),

	/**
	 * Get all saved queries for a connection
	 */
	listSavedQueries: protectedProcedure
		.input(z.object({ connectionId: z.number() }))
		.query(async ({ ctx, input }) => {
			return queryService.listSavedQueries(
				ctx.db,
				ctx.userId,
				input.connectionId
			);
		}),

	/**
	 * Get a specific saved query
	 */
	getSavedQuery: protectedProcedure
		.input(z.object({ id: z.number() }))
		.query(async ({ ctx, input }) => {
			return queryService.getSavedQuery(ctx.db, ctx.userId, input.id);
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
			const { id, ...data } = input;
			return queryService.updateSavedQuery(ctx.db, ctx.userId, id, data);
		}),

	/**
	 * Delete a saved query
	 */
	deleteSavedQuery: protectedProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			return queryService.deleteSavedQuery(ctx.db, ctx.userId, input.id);
		}),

	/**
	 * Execute a saved query and update its result
	 */
	executeSavedQuery: protectedProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			return queryService.executeSavedQuery(ctx, input.id);
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
			return queryService.executeAndSaveQuery(ctx, input);
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
			return queryService.executeQuery(ctx, input.connectionId, input.query);
		}),
});
