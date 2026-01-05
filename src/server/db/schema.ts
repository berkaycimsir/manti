import {
	boolean,
	index,
	integer,
	jsonb,
	pgTableCreator,
	serial,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator(name => `manti_${name}`);

// =============================================================================
// Application Tables
// =============================================================================

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
		sslMode: text("ssl_mode", {
			enum: ["disable", "prefer", "require", "verify-full"],
		}).default("disable"),
		isActive: boolean("is_active").default(false),
		// Track when the connection was last used (for idle timeout)
		lastUsedAt: timestamp("last_used_at", { mode: "date" }),
		// Connection settings
		color: text("color").default("blue"),
		defaultSchema: text("default_schema"),
		queryTimeoutSeconds: integer("query_timeout_seconds").default(60),
		rowLimit: integer("row_limit").default(500),
		isReadOnly: boolean("is_read_only").default(false),
		confirmDestructive: boolean("confirm_destructive").default(true),
		keepAliveSeconds: integer("keep_alive_seconds").default(0),
		autoReconnect: boolean("auto_reconnect").default(true),
		// Timestamps
		createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
		updatedAt: timestamp("updated_at", { mode: "date" })
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	table => ({
		userIdIndex: index("db_connections_user_id_idx").on(table.userId),
		userIdActiveIndex: index("db_connections_user_id_active_idx").on(
			table.userId,
			table.isActive
		),
	})
);

/**
 * Query tabs table - stores user's tabs for organizing saved queries
 */
export const queryTabs = createTable(
	"query_tabs",
	{
		id: serial("id").primaryKey(),
		userId: text("user_id").notNull(),
		connectionId: integer("connection_id")
			.notNull()
			.references(() => databaseConnections.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		position: integer("position").default(0).notNull(),
		createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
		updatedAt: timestamp("updated_at", { mode: "date" })
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	table => ({
		connectionIdIndex: index("query_tabs_connection_id_idx").on(
			table.connectionId
		),
		userIdIndex: index("query_tabs_user_id_idx").on(table.userId),
	})
);

/**
 * Saved queries table - stores user's SQL queries and their results
 */
export const savedQueries = createTable(
	"saved_queries",
	{
		id: serial("id").primaryKey(),
		userId: text("user_id").notNull(),
		connectionId: integer("connection_id")
			.notNull()
			.references(() => databaseConnections.id, { onDelete: "cascade" }),
		tabId: integer("tab_id").references(() => queryTabs.id, {
			onDelete: "set null",
		}),
		name: text("name").notNull(),
		query: text("query").notNull(),
		// Position within the tab (or uncategorized list)
		position: integer("position").default(0),
		// Store the last result as JSON (can be null if never executed)
		lastResult: jsonb("last_result"),
		lastExecutedAt: timestamp("last_executed_at", { mode: "date" }),
		executionTimeMs: integer("execution_time_ms"),
		rowCount: integer("row_count"),
		createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
		updatedAt: timestamp("updated_at", { mode: "date" })
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	table => ({
		connectionIdIndex: index("saved_queries_connection_id_idx").on(
			table.connectionId
		),
		userIdIndex: index("saved_queries_user_id_idx").on(table.userId),
		tabIdIndex: index("saved_queries_tab_id_idx").on(table.tabId),
	})
);

/**
 * Column transformations table - stores user's column display transformations
 * These are client-side only transformations for display purposes
 */
export const columnTransformations = createTable(
	"column_transformations",
	{
		id: serial("id").primaryKey(),
		userId: text("user_id").notNull(),
		connectionId: integer("connection_id")
			.notNull()
			.references(() => databaseConnections.id, { onDelete: "cascade" }),
		tableName: text("table_name").notNull(),
		columnName: text("column_name").notNull(),
		// Transformation type: date, number, boolean, json, truncate, mask, custom
		transformationType: text("transformation_type", {
			enum: [
				"date",
				"number",
				"boolean",
				"json",
				"truncate",
				"mask",
				"uppercase",
				"lowercase",
				"capitalize",
				"custom",
			],
		}).notNull(),
		// Transformation options stored as JSON
		// e.g., for date: { format: 'YYYY-MM-DD', timezone: 'UTC' }
		// e.g., for truncate: { maxLength: 50 }
		// e.g., for mask: { pattern: '****', showLast: 4 }
		options: jsonb("options"),
		isEnabled: boolean("is_enabled").default(true),
		createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
		updatedAt: timestamp("updated_at", { mode: "date" })
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	table => ({
		connectionTableIndex: index("col_transforms_conn_table_idx").on(
			table.connectionId,
			table.tableName
		),
		userIdIndex: index("col_transforms_user_id_idx").on(table.userId),
	})
);

/**
 * Column filters table - stores user's saved column filters for tables
 */
export const columnFilters = createTable(
	"column_filters",
	{
		id: serial("id").primaryKey(),
		userId: text("user_id").notNull(),
		connectionId: integer("connection_id")
			.notNull()
			.references(() => databaseConnections.id, { onDelete: "cascade" }),
		tableName: text("table_name").notNull(),
		columnName: text("column_name").notNull(),
		// Filter type: contains, equals, startsWith, endsWith, greaterThan, lessThan, between, isNull, isNotNull
		filterType: text("filter_type", {
			enum: [
				"contains",
				"equals",
				"not_equals",
				"starts_with",
				"ends_with",
				"greater_than",
				"less_than",
				"between",
				"is_null",
				"is_not_null",
				"in_list",
			],
		}).notNull(),
		// Filter value (can be null for is_null/is_not_null types)
		filterValue: text("filter_value"),
		// Second value for between filter type
		filterValueEnd: text("filter_value_end"),
		isEnabled: boolean("is_enabled").default(true),
		createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
		updatedAt: timestamp("updated_at", { mode: "date" })
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	table => ({
		connectionTableIndex: index("col_filters_conn_table_idx").on(
			table.connectionId,
			table.tableName
		),
		userIdIndex: index("col_filters_user_id_idx").on(table.userId),
	})
);
