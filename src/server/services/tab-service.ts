import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";

import { databaseConnections, queryTabs } from "~/server/db/schema";

type Db = typeof import("~/server/db").db;

export interface CreateTabInput {
	connectionId: number;
	name: string;
}

export interface UpdateTabInput {
	name?: string;
	position?: number;
}

export const tabService = {
	async listTabs(db: Db, userId: string, connectionId: number) {
		return db
			.select()
			.from(queryTabs)
			.where(
				and(
					eq(queryTabs.connectionId, connectionId),
					eq(queryTabs.userId, userId)
				)
			)
			.orderBy(queryTabs.position);
	},

	async createTab(db: Db, userId: string, input: CreateTabInput) {
		// Check connection exists
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

		// Get max position to append
		const maxPos = await db
			.select({ value: queryTabs.position })
			.from(queryTabs)
			.where(
				and(
					eq(queryTabs.connectionId, input.connectionId),
					eq(queryTabs.userId, userId)
				)
			)
			.orderBy(desc(queryTabs.position))
			.limit(1);

		const position = (maxPos[0]?.value ?? -1) + 1;

		const result = await db
			.insert(queryTabs)
			.values({
				userId: userId,
				connectionId: input.connectionId,
				name: input.name,
				position,
			})
			.returning();

		return result[0];
	},

	async updateTab(db: Db, userId: string, id: number, input: UpdateTabInput) {
		const updateData: { name?: string; position?: number; updatedAt: Date } = {
			updatedAt: new Date(),
		};

		if (input.name !== undefined) {
			updateData.name = input.name;
		}
		if (input.position !== undefined) {
			updateData.position = input.position;
		}

		const result = await db
			.update(queryTabs)
			.set(updateData)
			.where(and(eq(queryTabs.id, id), eq(queryTabs.userId, userId)))
			.returning();

		if (!result.length) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Tab not found",
			});
		}

		return result[0];
	},

	async deleteTab(db: Db, userId: string, id: number) {
		const result = await db
			.delete(queryTabs)
			.where(and(eq(queryTabs.id, id), eq(queryTabs.userId, userId)))
			.returning();

		if (!result.length) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Tab not found",
			});
		}

		return { success: true };
	},
};
