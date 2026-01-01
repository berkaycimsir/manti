import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { databaseConnections } from "~/server/db/schema";

/**
 * Mark a database connection as inactive in the database.
 */
export async function markConnectionAsInactive(
	connectionId: number,
): Promise<void> {
	try {
		await db
			.update(databaseConnections)
			.set({ isActive: false, lastUsedAt: null })
			.where(eq(databaseConnections.id, connectionId));

		console.log(
			`[ConnectionState] Marked connection ${connectionId} as inactive`,
		);
	} catch (error) {
		console.error(
			`[ConnectionState] Failed to mark connection ${connectionId} as inactive:`,
			error,
		);
		throw error;
	}
}

/**
 * Update the lastUsedAt timestamp for a connection.
 * Also marks the connection as active.
 */
export async function updateConnectionLastUsed(
	connectionId: number,
): Promise<void> {
	try {
		await db
			.update(databaseConnections)
			.set({ lastUsedAt: new Date(), isActive: true })
			.where(eq(databaseConnections.id, connectionId));
	} catch (error) {
		console.error(
			`[ConnectionState] Failed to update lastUsedAt for connection ${connectionId}:`,
			error,
		);
		// Non-critical - don't throw
	}
}

/**
 * Get the lastUsedAt timestamp for a connection.
 */
export async function getConnectionLastUsed(
	connectionId: number,
): Promise<Date | null> {
	try {
		const result = await db
			.select({ lastUsedAt: databaseConnections.lastUsedAt })
			.from(databaseConnections)
			.where(eq(databaseConnections.id, connectionId));

		return result[0]?.lastUsedAt ?? null;
	} catch (error) {
		console.error(
			`[ConnectionState] Failed to get lastUsedAt for connection ${connectionId}:`,
			error,
		);
		return null;
	}
}
