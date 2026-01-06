import type {
	DateFormatOption,
	TransformationOption,
	TransformationType,
} from "~/types/transformations";

/**
 * Transformation options configuration
 * Single source of truth for all transformation metadata
 */
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

/**
 * Date format options for date transformation
 */
export const DATE_FORMATS: DateFormatOption[] = [
	{ label: "YYYY-MM-DD HH:mm:ss", value: "YYYY-MM-DD HH:mm:ss" },
	{ label: "YYYY-MM-DD", value: "YYYY-MM-DD" },
	{ label: "MM/DD/YYYY", value: "MM/DD/YYYY" },
	{ label: "DD/MM/YYYY", value: "DD/MM/YYYY" },
	{ label: "MMM DD, YYYY", value: "MMM DD, YYYY" },
	{ label: "Relative (2 hours ago)", value: "relative" },
	{ label: "ISO 8601", value: "ISO" },
];

/**
 * Get transformation option by type
 */
export function getTransformationOption(
	type: TransformationType
): TransformationOption | undefined {
	return TRANSFORMATION_OPTIONS.find(t => t.type === type);
}

/**
 * Get transformation label by type
 */
export function getTransformationLabel(type: string): string {
	const option = TRANSFORMATION_OPTIONS.find(t => t.type === type);
	return option?.label ?? type;
}

/**
 * Get transformation icon name by type
 */
export function getTransformationIconName(type: string): string {
	const option = TRANSFORMATION_OPTIONS.find(t => t.type === type);
	return option?.icon ?? "Settings2";
}

/**
 * Get default options for a transformation type
 */
export function getDefaultTransformationOptions(
	type: TransformationType
): Record<string, unknown> {
	const option = getTransformationOption(type);
	return option?.defaultOptions ?? {};
}
