import { TRPCError } from "@trpc/server";
import { and, count, eq } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import {
	columnFilters,
	columnTransformations,
	databaseConnections,
	queryTabs,
	savedQueries,
} from "~/server/db/schema";

export const userDataRouter = createTRPCRouter({
	getSummary: protectedProcedure.query(async ({ ctx }) => {
		const [connections] = await db
			.select({ count: count() })
			.from(databaseConnections)
			.where(eq(databaseConnections.userId, ctx.userId));

		const [queries] = await db
			.select({ count: count() })
			.from(savedQueries)
			.where(eq(savedQueries.userId, ctx.userId));

		const [tabs] = await db
			.select({ count: count() })
			.from(queryTabs)
			.where(eq(queryTabs.userId, ctx.userId));

		const [filters] = await db
			.select({ count: count() })
			.from(columnFilters)
			.where(eq(columnFilters.userId, ctx.userId));

		const [transformations] = await db
			.select({ count: count() })
			.from(columnTransformations)
			.where(eq(columnTransformations.userId, ctx.userId));

		return {
			connections: connections?.count ?? 0,
			queries: queries?.count ?? 0,
			tabs: tabs?.count ?? 0,
			filters: filters?.count ?? 0,
			transformations: transformations?.count ?? 0,
		};
	}),

	getDetailedUsage: protectedProcedure.query(async ({ ctx }) => {
		const connections = await db
			.select()
			.from(databaseConnections)
			.where(eq(databaseConnections.userId, ctx.userId));

		// Helper to get counts by connection
		const getCounts = async (table: any) => {
			return await db
				.select({ connectionId: table.connectionId, count: count() })
				.from(table)
				.where(eq(table.userId, ctx.userId))
				.groupBy(table.connectionId);
		};

		const [queryCounts, tabCounts, filterCounts, transformCounts] =
			await Promise.all([
				getCounts(savedQueries),
				getCounts(queryTabs),
				getCounts(columnFilters),
				getCounts(columnTransformations),
			]);

		return connections.map(conn => ({
			...conn,
			stats: {
				queries: queryCounts.find(c => c.connectionId === conn.id)?.count ?? 0,
				tabs: tabCounts.find(c => c.connectionId === conn.id)?.count ?? 0,
				filters: filterCounts.find(c => c.connectionId === conn.id)?.count ?? 0,
				transformations:
					transformCounts.find(c => c.connectionId === conn.id)?.count ?? 0,
			},
		}));
	}),

	clearConnectionData: protectedProcedure
		.input(
			z.object({
				connectionId: z.number(),
				type: z.enum(["queries", "tabs", "filters", "transformations"]),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const targetTable = {
				queries: savedQueries,
				tabs: queryTabs,
				filters: columnFilters,
				transformations: columnTransformations,
			}[input.type];

			await db
				.delete(targetTable)
				.where(
					and(
						eq(targetTable.connectionId, input.connectionId),
						eq(targetTable.userId, ctx.userId)
					)
				);
			return { success: true };
		}),

	clearData: protectedProcedure
		.input(
			z.object({
				type: z.enum([
					"connections",
					"queries",
					"tabs",
					"filters",
					"transformations",
				]),
			})
		)
		.mutation(async ({ ctx, input }) => {
			switch (input.type) {
				case "connections":
					await db
						.delete(databaseConnections)
						.where(eq(databaseConnections.userId, ctx.userId));
					break;
				case "queries":
					await db
						.delete(savedQueries)
						.where(eq(savedQueries.userId, ctx.userId));
					break;
				case "tabs":
					await db.delete(queryTabs).where(eq(queryTabs.userId, ctx.userId));
					break;
				case "filters":
					await db
						.delete(columnFilters)
						.where(eq(columnFilters.userId, ctx.userId));
					break;
				case "transformations":
					await db
						.delete(columnTransformations)
						.where(eq(columnTransformations.userId, ctx.userId));
					break;
				default:
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Invalid data type",
					});
			}
			return { success: true };
		}),
});
