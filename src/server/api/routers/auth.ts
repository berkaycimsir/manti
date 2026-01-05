import { TRPCError } from "@trpc/server";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import {
	session as sessionTable,
	user as userTable,
} from "~/server/db/auth-schema";
import { databaseConnections } from "~/server/db/schema";

export const authRouter = createTRPCRouter({
	listSessions: protectedProcedure.query(async ({ ctx }) => {
		return await db
			.select()
			.from(sessionTable)
			.where(eq(sessionTable.userId, ctx.userId))
			.orderBy(sessionTable.expiresAt); // Order by expiry
	}),

	revokeSession: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			await db
				.delete(sessionTable)
				.where(
					and(
						eq(sessionTable.id, input.id),
						eq(sessionTable.userId, ctx.userId)
					)
				);
		}),

	revokeAllOtherSessions: protectedProcedure.mutation(async ({ ctx }) => {
		if (!ctx.session) {
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message: "No active session",
			});
		}

		await db
			.delete(sessionTable)
			.where(
				and(
					eq(sessionTable.userId, ctx.userId),
					ne(sessionTable.token, ctx.session.token)
				)
			);
	}),

	deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
		// 1. Delete all database connections (cascades to queries, tabs, etc.)
		await db
			.delete(databaseConnections)
			.where(eq(databaseConnections.userId, ctx.userId));

		// 2. Delete the user (cascades to sessions, accounts based on schema definition)
		await db.delete(userTable).where(eq(userTable.id, ctx.userId));
	}),
});
