/**
 * Filter type definitions
 * Single source of truth for all filter-related types
 */

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
