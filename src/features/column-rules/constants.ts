/**
 * Column rules constants
 * Single source of truth for all filter and transformation options
 */

import type { FilterOption, FilterType } from "./types";
import type {
	DateFormatOption,
	TransformationOption,
	TransformationType,
} from "./types";

// =============================================================================
// FILTER OPTIONS
// =============================================================================

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

export function getFilterOption(type: FilterType): FilterOption | undefined {
	return FILTER_OPTIONS.find(f => f.type === type);
}

export function getFilterLabel(type: string): string {
	const option = FILTER_OPTIONS.find(f => f.type === type);
	return option?.label ?? type;
}

export function getFilterIconName(type: string): string {
	const option = FILTER_OPTIONS.find(f => f.type === type);
	return option?.icon ?? "Filter";
}

export function filterNeedsValue(type: FilterType): boolean {
	const option = getFilterOption(type);
	return option?.needsValue ?? false;
}

export function filterNeedsSecondValue(type: FilterType): boolean {
	const option = getFilterOption(type);
	return option?.needsSecondValue ?? false;
}

// =============================================================================
// TRANSFORMATION OPTIONS
// =============================================================================

export const TRANSFORMATION_OPTIONS: TransformationOption[] = [
	{
		type: "date",
		label: "Date Format",
		icon: "Calendar",
		description: "Format date/timestamp values",
		defaultOptions: { format: "YYYY-MM-DD HH:mm:ss", timezone: "local" },
	},
	{
		type: "number",
		label: "Number Format",
		icon: "Hash",
		description: "Format numeric values",
		defaultOptions: {
			decimals: 2,
			thousandsSeparator: ",",
			prefix: "",
			suffix: "",
		},
	},
	{
		type: "boolean",
		label: "Boolean Display",
		icon: "CheckCircle2",
		description: "Customize true/false display",
		defaultOptions: { trueLabel: "✓ Yes", falseLabel: "✗ No" },
	},
	{
		type: "json",
		label: "JSON Pretty Print",
		icon: "Braces",
		description: "Format JSON with indentation",
		defaultOptions: { indent: 2 },
	},
	{
		type: "truncate",
		label: "Truncate Text",
		icon: "Scissors",
		description: "Limit text length",
		defaultOptions: { maxLength: 50, suffix: "..." },
	},
	{
		type: "mask",
		label: "Mask Data",
		icon: "Eye",
		description: "Hide sensitive information",
		defaultOptions: { maskChar: "*", showFirst: 0, showLast: 4 },
	},
	{
		type: "uppercase",
		label: "UPPERCASE",
		icon: "ArrowUp",
		description: "Convert to uppercase",
		defaultOptions: {},
	},
	{
		type: "lowercase",
		label: "lowercase",
		icon: "ArrowDown",
		description: "Convert to lowercase",
		defaultOptions: {},
	},
	{
		type: "capitalize",
		label: "Capitalize",
		icon: "CaseSensitive",
		description: "Capitalize first letter",
		defaultOptions: {},
	},
];

export const DATE_FORMATS: DateFormatOption[] = [
	{ label: "YYYY-MM-DD HH:mm:ss", value: "YYYY-MM-DD HH:mm:ss" },
	{ label: "YYYY-MM-DD", value: "YYYY-MM-DD" },
	{ label: "MM/DD/YYYY", value: "MM/DD/YYYY" },
	{ label: "DD/MM/YYYY", value: "DD/MM/YYYY" },
	{ label: "MMM DD, YYYY", value: "MMM DD, YYYY" },
	{ label: "Relative (2 hours ago)", value: "relative" },
	{ label: "ISO 8601", value: "ISO" },
];

export function getTransformationOption(
	type: TransformationType
): TransformationOption | undefined {
	return TRANSFORMATION_OPTIONS.find(t => t.type === type);
}

export function getTransformationLabel(type: string): string {
	const option = TRANSFORMATION_OPTIONS.find(t => t.type === type);
	return option?.label ?? type;
}

export function getTransformationIconName(type: string): string {
	const option = TRANSFORMATION_OPTIONS.find(t => t.type === type);
	return option?.icon ?? "Settings2";
}

export function getDefaultTransformationOptions(
	type: TransformationType
): Record<string, unknown> {
	const option = getTransformationOption(type);
	return option?.defaultOptions ?? {};
}
