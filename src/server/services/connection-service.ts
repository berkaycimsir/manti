import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";

import type { z } from "zod";
import type { connectionInputSchema } from "~/server/api/routers/database/connection";
import { connectionPool } from "~/server/db/connection-pool";
import {
	getValidatedConnection,
	parseAllFromConnectionString,
} from "~/server/db/connection-utils";
import { encryptSensitiveData } from "~/server/db/encryption";
import { testConnection as testConnectionUtil } from "~/server/db/query-utils";
import { databaseConnections } from "~/server/db/schema";

type Db = typeof import("~/server/db").db;
type CreateConnectionInput = z.infer<typeof connectionInputSchema>;

export type UpdateConnectionInput = {
	name?: string;
	connectionType?: "connection_string" | "manual";
	host?: string;
	port?: number;
	username?: string;
	password?: string;
	database?: string;
	ssl?: boolean;
	sslMode?: "disable" | "prefer" | "require" | "verify-full";
	connectionString?: string;
	isActive?: boolean;
	color?: string;
	defaultSchema?: string | null;
	queryTimeoutSeconds?: number;
	rowLimit?: number;
	isReadOnly?: boolean;
	confirmDestructive?: boolean;
	keepAliveSeconds?: number;
	autoReconnect?: boolean;
};

export const connectionService = {
	async createConnection(db: Db, userId: string, input: CreateConnectionInput) {
		let encryptedPassword: string | null = null;
		let encryptedConnectionString: string | null = null;

		if (input.connectionType === "connection_string") {
			encryptedConnectionString = encryptSensitiveData(input.connectionString);
		} else {
			encryptedPassword = input.password
				? encryptSensitiveData(input.password)
				: null;
		}

		const connectionParams =
			input.connectionType === "connection_string"
				? parseAllFromConnectionString(input.connectionString)
				: null;

		const result = await db
			.insert(databaseConnections)
			.values({
				userId: userId,
				name: input.name,
				connectionType: input.connectionType,
				connectionString: encryptedConnectionString,
				host:
					input.connectionType === "manual"
						? input.host
						: connectionParams?.host,
				port:
					input.connectionType === "manual"
						? input.port
						: connectionParams?.port,
				username:
					input.connectionType === "manual"
						? input.username
						: connectionParams?.username,
				password: encryptedPassword,
				database:
					input.connectionType === "manual"
						? input.database
						: connectionParams?.database,
				ssl: input.connectionType === "manual" ? input.ssl : false,
				sslMode: input.connectionType === "manual" ? input.sslMode : "disable",
			})
			.returning();

		return result[0];
	},

	async listConnections(db: Db, userId: string) {
		return db.query.databaseConnections.findMany({
			where: eq(databaseConnections.userId, userId),
			orderBy: [
				desc(databaseConnections.isActive),
				desc(databaseConnections.lastUsedAt),
			],
		});
	},

	async getConnection(db: Db, userId: string, connectionId: number) {
		const connection = await db.query.databaseConnections.findFirst({
			where: and(
				eq(databaseConnections.id, connectionId),
				eq(databaseConnections.userId, userId)
			),
		});

		if (!connection) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Connection not found",
			});
		}

		return connection;
	},

	async updateConnection(
		db: Db,
		userId: string,
		connectionId: number,
		data: UpdateConnectionInput
	) {
		// Verify ownership
		await this.getConnection(db, userId, connectionId);

		if (data.isActive === false) {
			await connectionPool.closeConnection(connectionId);
		}

		const updateData: Record<string, unknown> = {
			updatedAt: new Date(),
		};

		// Basic fields
		if (data.name !== undefined) updateData.name = data.name;
		if (data.isActive !== undefined) updateData.isActive = data.isActive;

		// Connection Type change logic
		if (data.connectionType !== undefined) {
			updateData.connectionType = data.connectionType;
			if (data.connectionType === "connection_string") {
				updateData.host = null;
				updateData.port = null;
				updateData.username = null;
				updateData.password = null;
				updateData.database = null;
				updateData.ssl = false;
				updateData.sslMode = "disable";
			} else {
				updateData.connectionString = null;
			}
		}

		// Manual fields
		if (data.host !== undefined) updateData.host = data.host;
		if (data.port !== undefined) updateData.port = data.port;
		if (data.username !== undefined) updateData.username = data.username;
		if (data.database !== undefined) updateData.database = data.database;
		if (data.ssl !== undefined) updateData.ssl = data.ssl;
		if (data.sslMode !== undefined) updateData.sslMode = data.sslMode;

		if (data.password) {
			updateData.password = encryptSensitiveData(data.password);
		}

		// Connection String fields
		if (data.connectionString) {
			updateData.connectionString = encryptSensitiveData(data.connectionString);

			const connectionParams = parseAllFromConnectionString(
				data.connectionString
			);

			if (updateData.host === undefined)
				updateData.host = connectionParams.host;
			if (updateData.port === undefined)
				updateData.port = connectionParams.port;
			if (updateData.username === undefined)
				updateData.username = connectionParams.username;
			if (updateData.database === undefined)
				updateData.database = connectionParams.database;
		}

		// Settings fields
		if (data.color !== undefined) updateData.color = data.color;
		if (data.defaultSchema !== undefined)
			updateData.defaultSchema = data.defaultSchema;
		if (data.queryTimeoutSeconds !== undefined)
			updateData.queryTimeoutSeconds = data.queryTimeoutSeconds;
		if (data.rowLimit !== undefined) updateData.rowLimit = data.rowLimit;
		if (data.isReadOnly !== undefined) updateData.isReadOnly = data.isReadOnly;
		if (data.confirmDestructive !== undefined)
			updateData.confirmDestructive = data.confirmDestructive;
		if (data.keepAliveSeconds !== undefined)
			updateData.keepAliveSeconds = data.keepAliveSeconds;
		if (data.autoReconnect !== undefined)
			updateData.autoReconnect = data.autoReconnect;

		// Perform update
		const result = await db
			.update(databaseConnections)
			.set(updateData)
			.where(eq(databaseConnections.id, connectionId))
			.returning();

		return result[0];
	},

	async deleteConnection(db: Db, userId: string, connectionId: number) {
		// Verify ownership
		await this.getConnection(db, userId, connectionId);

		await connectionPool.closeConnection(connectionId);

		await db
			.delete(databaseConnections)
			.where(eq(databaseConnections.id, connectionId));

		return { success: true };
	},

	async reconnectConnection(
		ctx: { db: Db; userId: string },
		connectionId: number
	) {
		try {
			const dbClient = await getValidatedConnection(ctx, connectionId);
			const isConnected = await testConnectionUtil(dbClient);

			if (!isConnected) {
				throw new Error("Connection test failed");
			}

			const updated = await ctx.db
				.update(databaseConnections)
				.set({
					isActive: true,
					updatedAt: new Date(),
				})
				.where(eq(databaseConnections.id, connectionId))
				.returning();

			return { success: true, connection: updated[0] };
		} catch (error) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message:
					error instanceof Error
						? error.message
						: "Failed to reconnect to database",
			});
		}
	},
};
