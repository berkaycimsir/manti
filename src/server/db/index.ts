import { neon } from "@neondatabase/serverless";
import { type NeonHttpClient, drizzle } from "drizzle-orm/neon-http";

import { env } from "~/env";
import * as schema from "./schema";

/**
 * Cache the Neon client in development to avoid creating a new connection on every HMR update.
 */
const globalForNeon = globalThis as unknown as {
	neonClient?: NeonHttpClient;
};

globalForNeon.neonClient ??= neon(env.DATABASE_URL);

export const db = drizzle({ client: globalForNeon.neonClient, schema });
