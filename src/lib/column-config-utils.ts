import type { FilterConfig, FilterRecord, FilterType } from "~/types/filters";
import type {
	TransformationConfig,
	TransformationRecord,
	TransformationType,
} from "~/types/transformations";

/**
 * Format transformation/filter options for display
 */
export function formatOptions(options: unknown): string | null {
	if (!options || typeof options !== "object") return null;
	const entries = Object.entries(options as Record<string, unknown>);
	if (entries.length === 0) return null;
	const display = entries
		.slice(0, 2)
		.map(([k, v]) => `${k}: ${String(v)}`)
		.join(", ");
	return entries.length > 2 ? `${display}...` : display;
}

/**
 * Check if a column has a table-specific override
 */
export function hasTableOverride<
	T extends { tableName: string | null; columnName: string },
>(items: T[], columnName: string): boolean {
	return items.some(
		item => item.columnName === columnName && item.tableName !== null
	);
}

/**
 * Merge global and table-specific transformations
 * Table-specific transformations override global ones
 * If table-specific is disabled, falls back to global
 */
export function mergeTransformations(
	records: TransformationRecord[]
): TransformationConfig[] {
	const tableSpecific = records.filter(t => t.tableName !== null);
	const global = records.filter(t => t.tableName === null);

	const transformationMap = new Map<string, TransformationRecord>();

	// Add global transformations first
	for (const t of global) {
		transformationMap.set(t.columnName, t);
	}

	// Override with table-specific transformations (only if enabled)
	for (const t of tableSpecific) {
		if (t.isEnabled) {
			transformationMap.set(t.columnName, t);
		} else {
			// If table-specific is disabled, keep or restore the global
			const globalForColumn = global.find(g => g.columnName === t.columnName);
			if (globalForColumn) {
				transformationMap.set(t.columnName, globalForColumn);
			} else {
				transformationMap.delete(t.columnName);
			}
		}
	}

	// Convert to TransformationConfig format
	return Array.from(transformationMap.values()).map(t => ({
		columnName: t.columnName,
		transformationType: t.transformationType as TransformationType,
		options: (t.options as Record<string, unknown>) ?? {},
		isEnabled: t.isEnabled ?? true,
	}));
}

/**
 * Merge global and table-specific filters
 * Table-specific filters override global ones
 * If table-specific is disabled, falls back to global
 */
export function mergeFilters(records: FilterRecord[]): FilterConfig[] {
	const tableSpecific = records.filter(f => f.tableName !== null);
	const global = records.filter(f => f.tableName === null);

	const filterMap = new Map<string, FilterRecord>();

	// Add global filters first
	for (const f of global) {
		filterMap.set(f.columnName, f);
	}

	// Override with table-specific filters (only if enabled)
	for (const f of tableSpecific) {
		if (f.isEnabled) {
			filterMap.set(f.columnName, f);
		} else {
			// If table-specific is disabled, keep or restore the global
			const globalForColumn = global.find(g => g.columnName === f.columnName);
			if (globalForColumn) {
				filterMap.set(f.columnName, globalForColumn);
			} else {
				filterMap.delete(f.columnName);
			}
		}
	}

	// Convert to FilterConfig format
	return Array.from(filterMap.values()).map(f => ({
		id: f.id,
		columnName: f.columnName,
		filterType: f.filterType as FilterType,
		filterValue: f.filterValue,
		filterValueEnd: f.filterValueEnd,
		isEnabled: f.isEnabled,
	}));
}

/**
 * Separate table-specific records from global ones
 */
export function separateRecords<T extends { tableName: string | null }>(
	records: T[]
): { tableSpecific: T[]; global: T[] } {
	return {
		tableSpecific: records.filter(r => r.tableName !== null),
		global: records.filter(r => r.tableName === null),
	};
}
