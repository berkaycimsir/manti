/**
 * Transformation type definitions
 * Single source of truth for all transformation-related types
 */

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
