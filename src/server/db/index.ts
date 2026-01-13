import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "~/env";
import * as schema from "./schema";

/**
 * Cache the database client in development to avoid creating a new connection on every HMR update.
 */
const globalForDb = globalThis as unknown as {
	dbClient?: ReturnType<typeof postgres>;
};

globalForDb.dbClient ??= postgres(env.DATABASE_URL);

export const db = drizzle({ client: globalForDb.dbClient, schema });
