import {
	index,
	integer,
	pgTableCreator,
	serial,
	text,
	timestamp,
	boolean,
} from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `manti_${name}`);

/**
 * Database connections table - stores user's database connection configs
 */
export const databaseConnections = createTable(
	"database_connections",
	{
		id: serial("id").primaryKey(),
		userId: text("user_id").notNull(),
		name: text("name").notNull(),
		// Connection type: 'connection_string' or 'manual'
		connectionType: text("connection_type", {
			enum: ["connection_string", "manual"],
		}).notNull(),
		// For connection string type
		connectionString: text("connection_string"),
		// For manual type
		host: text("host"),
		port: integer("port"),
		username: text("username"),
		password: text("password"), // encrypted
		database: text("database"),
		// Additional connection options
		ssl: boolean("ssl").default(false),
		isActive: boolean("is_active").default(false),
		createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
		updatedAt: timestamp("updated_at", { mode: "date" })
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => ({
		userIdIndex: index("db_connections_user_id_idx").on(table.userId),
		userIdActiveIndex: index("db_connections_user_id_active_idx").on(
			table.userId,
			table.isActive,
		),
	}),
);
