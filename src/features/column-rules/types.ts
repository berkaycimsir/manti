/**
 * Column rules feature types
 * Single source of truth for all column-rule related types (Filters + Transformations)
 */

// =============================================================================
// FILTER TYPES
// =============================================================================

export type FilterType =
	| "contains"
	| "equals"
	| "not_equals"
	| "starts_with"
	| "ends_with"
	| "greater_than"
	| "less_than"
	| "between"
	| "is_null"
	| "is_not_null"
	| "in_list";

export interface FilterConfig {
	id: number;
	columnName: string;
	filterType: FilterType;
	filterValue: string | null;
	filterValueEnd: string | null;
	isEnabled: boolean | null;
}

export interface FilterOption {
	type: FilterType;
	label: string;
	icon: string; // Lucide icon name
	description: string;
	needsValue: boolean;
	needsSecondValue: boolean;
}

/**
 * Database filter record (from API)
 */
export interface FilterRecord {
	id: number;
	userId: string;
	connectionId: number;
	tableName: string | null;
	columnName: string;
	filterType: string;
	filterValue: string | null;
	filterValueEnd: string | null;
	isEnabled: boolean | null;
	createdAt: Date | null;
	updatedAt: Date | null;
}

// =============================================================================
// TRANSFORMATION TYPES
// =============================================================================

export type TransformationType =
	| "date"
	| "number"
	| "boolean"
	| "json"
	| "truncate"
	| "mask"
	| "uppercase"
	| "lowercase"
	| "capitalize"
	| "custom";

export interface TransformationConfig {
	columnName: string;
	transformationType: TransformationType;
	options: Record<string, unknown>;
	isEnabled: boolean;
}

export interface TransformationOption {
	type: TransformationType;
	label: string;
	icon: string; // Lucide icon name
	description: string;
	defaultOptions: Record<string, unknown>;
}

export interface DateFormatOption {
	label: string;
	value: string;
}

/**
 * Database transformation record (from API)
 */
export interface TransformationRecord {
	id: number;
	userId: string;
	connectionId: number;
	tableName: string | null;
	columnName: string;
	transformationType: string;
	options: unknown;
	isEnabled: boolean | null;
	createdAt: Date | null;
	updatedAt: Date | null;
}
