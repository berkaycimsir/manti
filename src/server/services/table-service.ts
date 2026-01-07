import { and, eq } from "drizzle-orm";

import { getValidatedConnection } from "~/server/db/connection-utils";
import {
	getSchemas,
	getTableColumns,
	getTableData,
	getTables,
} from "~/server/db/query-utils";
import { databaseConnections } from "~/server/db/schema";

type Db = typeof import("~/server/db").db;

export const tableService = {
	async getTables(ctx: { db: Db; userId: string }, connectionId: number) {
		const db = await getValidatedConnection(ctx, connectionId);
		return await getTables(db);
	},

	async getSchemas(ctx: { db: Db; userId: string }, connectionId: number) {
		const db = await getValidatedConnection(ctx, connectionId);
		return await getSchemas(db);
	},

	async getTableColumns(
		ctx: { db: Db; userId: string },
		connectionId: number,
		tableName: string,
		schemaName = "public"
	) {
		const db = await getValidatedConnection(ctx, connectionId);
		return await getTableColumns(db, tableName, schemaName);
	},

	async getTableData(
		ctx: { db: Db; userId: string },
		connectionId: number,
		tableName: string,
		schemaName = "public",
		limit = 100,
		offset = 0
	) {
		const connection = await ctx.db.query.databaseConnections.findFirst({
			where: and(
				eq(databaseConnections.id, connectionId),
				eq(databaseConnections.userId, ctx.userId)
			),
			columns: {
				queryTimeoutSeconds: true,
				rowLimit: true,
			},
		});

		const db = await getValidatedConnection(ctx, connectionId);
		const effectiveLimit = connection?.rowLimit
			? Math.min(limit, connection.rowLimit)
			: limit;

		return await getTableData(
			db,
			tableName,
			schemaName,
			effectiveLimit,
			offset,
			{ queryTimeoutSeconds: connection?.queryTimeoutSeconds ?? 60 }
		);
	},

	async getCommonColumns(
		ctx: { db: Db; userId: string },
		connectionId: number
	) {
		const db = await getValidatedConnection(ctx, connectionId);
		const tables = await getTables(db);

		// Get all columns from all tables
		const columnCounts = new Map<
			string,
			{ count: number; types: Set<string> }
		>();

		for (const table of tables) {
			const columns = await getTableColumns(db, table.name, table.schema);
			for (const col of columns) {
				const existing = columnCounts.get(col.name);
				if (existing) {
					existing.count++;
					existing.types.add(col.type);
				} else {
					columnCounts.set(col.name, {
						count: 1,
						types: new Set([col.type]),
					});
				}
			}
		}

		// Return columns sorted by frequency (most common first)
		return Array.from(columnCounts.entries())
			.map(([name, { count, types }]) => ({
				name,
				tableCount: count,
				types: Array.from(types),
			}))
			.sort((a, b) => b.tableCount - a.tableCount);
	},
};
