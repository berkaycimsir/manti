/**
 * Kysely interface definitions for PostgreSQL information_schema tables.
 * Used for querying system metadata in a type-safe way.
 */
export interface InformationSchemaTables {
	table_catalog: string;
	table_schema: string;
	table_name: string;
	table_type: string;
	self_referencing_column_name: string | null;
	reference_generation: string | null;
	user_defined_type_catalog: string | null;
	user_defined_type_schema: string | null;
	user_defined_type_name: string | null;
	is_insertable_into: "YES" | "NO" | null;
	is_typed: "YES" | "NO" | null;
	commit_action: string | null;
}

export interface InformationSchemaColumns {
	table_catalog: string;
	table_schema: string;
	table_name: string;
	column_name: string;
	ordinal_position: number;
	column_default: string | null;
	is_nullable: "YES" | "NO";
	data_type: string;
	character_maximum_length: number | null;
	character_octet_length: number | null;
	numeric_precision: number | null;
	numeric_precision_radix: number | null;
	numeric_scale: number | null;
	datetime_precision: number | null;
	interval_type: string | null;
	interval_precision: number | null;
	character_set_catalog: string | null;
	character_set_schema: string | null;
	character_set_name: string | null;
	collation_catalog: string | null;
	collation_schema: string | null;
	collation_name: string | null;
	domain_catalog: string | null;
	domain_schema: string | null;
	domain_name: string | null;
	udt_catalog: string | null;
	udt_schema: string | null;
	udt_name: string | null;
	scope_catalog: string | null;
	scope_schema: string | null;
	scope_name: string | null;
	maximum_cardinality: number | null;
	dtd_identifier: string | null;
	is_self_referencing: "YES" | "NO" | null;
	is_identity: "YES" | "NO" | null;
	identity_generation: string | null;
	identity_start: string | null;
	identity_increment: string | null;
	identity_maximum: string | null;
	identity_minimum: string | null;
	identity_cycle: "YES" | "NO" | null;
	is_generated: "NEVER" | "ALWAYS" | null;
	generation_expression: string | null;
	is_updatable: "YES" | "NO" | null;
}

export interface InformationSchemaSchemata {
	catalog_name: string;
	schema_name: string;
	schema_owner: string | null;
	default_character_set_catalog: string | null;
	default_character_set_schema: string | null;
	default_character_set_name: string | null;
	sql_path: string | null;
}

export interface PgCatalogTables {
	tablename: string;
	schemaname: string;
	tableowner: string;
}

export interface SystemSchema {
	"information_schema.tables": InformationSchemaTables;
	"information_schema.columns": InformationSchemaColumns;
	"information_schema.schemata": InformationSchemaSchemata;
	"pg_catalog.pg_tables": PgCatalogTables;
}
