import type { FilterOption, FilterType } from "~/types/filters";

/**
 * Filter options configuration
 * Single source of truth for all filter metadata
 */
export const FILTER_OPTIONS: FilterOption[] = [
	{
		type: "contains",
		label: "Contains",
		icon: "Search",
		description: "Value contains text",
		needsValue: true,
		needsSecondValue: false,
	},
	{
		type: "equals",
		label: "Equals",
		icon: "Equal",
		description: "Value equals exactly",
		needsValue: true,
		needsSecondValue: false,
	},
	{
		type: "not_equals",
		label: "Not Equals",
		icon: "EqualNot",
		description: "Value does not equal",
		needsValue: true,
		needsSecondValue: false,
	},
	{
		type: "starts_with",
		label: "Starts With",
		icon: "TextCursorInput",
		description: "Value starts with text",
		needsValue: true,
		needsSecondValue: false,
	},
	{
		type: "ends_with",
		label: "Ends With",
		icon: "TextCursor",
		description: "Value ends with text",
		needsValue: true,
		needsSecondValue: false,
	},
	{
		type: "greater_than",
		label: "Greater Than",
		icon: "ChevronRight",
		description: "Value is greater than",
		needsValue: true,
		needsSecondValue: false,
	},
	{
		type: "less_than",
		label: "Less Than",
		icon: "ChevronLeft",
		description: "Value is less than",
		needsValue: true,
		needsSecondValue: false,
	},
	{
		type: "between",
		label: "Between",
		icon: "ArrowLeftRight",
		description: "Value is between two values",
		needsValue: true,
		needsSecondValue: true,
	},
	{
		type: "is_null",
		label: "Is Null",
		icon: "CircleSlash",
		description: "Value is null/empty",
		needsValue: false,
		needsSecondValue: false,
	},
	{
		type: "is_not_null",
		label: "Is Not Null",
		icon: "Circle",
		description: "Value is not null/empty",
		needsValue: false,
		needsSecondValue: false,
	},
	{
		type: "in_list",
		label: "In List",
		icon: "List",
		description: "Value is in comma-separated list",
		needsValue: true,
		needsSecondValue: false,
	},
];

/**
 * Get filter option by type
 */
export function getFilterOption(type: FilterType): FilterOption | undefined {
	return FILTER_OPTIONS.find(f => f.type === type);
}

/**
 * Get filter label by type
 */
export function getFilterLabel(type: string): string {
	const option = FILTER_OPTIONS.find(f => f.type === type);
	return option?.label ?? type;
}

/**
 * Get filter icon name by type
 */
export function getFilterIconName(type: string): string {
	const option = FILTER_OPTIONS.find(f => f.type === type);
	return option?.icon ?? "Filter";
}

/**
 * Check if filter type needs a value
 */
export function filterNeedsValue(type: FilterType): boolean {
	const option = getFilterOption(type);
	return option?.needsValue ?? false;
}

/**
 * Check if filter type needs a second value
 */
export function filterNeedsSecondValue(type: FilterType): boolean {
	const option = getFilterOption(type);
	return option?.needsSecondValue ?? false;
}
