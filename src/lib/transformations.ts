/**
 * Column transformation utilities
 * These transformations are applied client-side for display purposes only
 */

import type {
	TransformationConfig,
	TransformationType,
} from "~/types/transformations";

// Re-export types for backward compatibility
export type { TransformationConfig, TransformationType };

/**
 * Format a date value based on the specified format
 */
function formatDate(value: unknown, options: Record<string, unknown>): string {
	if (value === null || value === undefined) return "∅";

	const date = new Date(value as string | number | Date);
	if (Number.isNaN(date.getTime())) return String(value);

	const format = (options.format as string) || "YYYY-MM-DD HH:mm:ss";

	// Handle relative format
	if (format === "relative") {
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffSec = Math.floor(diffMs / 1000);
		const diffMin = Math.floor(diffSec / 60);
		const diffHour = Math.floor(diffMin / 60);
		const diffDay = Math.floor(diffHour / 24);

		if (diffSec < 60) return "just now";
		if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`;
		if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`;
		if (diffDay < 30) return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;

		return date.toLocaleDateString();
	}

	// Handle ISO format
	if (format === "ISO") {
		return date.toISOString();
	}

	// Simple format replacement
	const year = date.getFullYear();
	const month = date.getMonth() + 1;
	const day = date.getDate();
	const hours = date.getHours();
	const minutes = date.getMinutes();
	const seconds = date.getSeconds();

	const monthNames = [
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"May",
		"Jun",
		"Jul",
		"Aug",
		"Sep",
		"Oct",
		"Nov",
		"Dec",
	];

	return format
		.replace("YYYY", String(year))
		.replace("MM", String(month).padStart(2, "0"))
		.replace("MMM", monthNames[month - 1] ?? "")
		.replace("DD", String(day).padStart(2, "0"))
		.replace("HH", String(hours).padStart(2, "0"))
		.replace("mm", String(minutes).padStart(2, "0"))
		.replace("ss", String(seconds).padStart(2, "0"));
}

/**
 * Format a number value
 */
function formatNumber(
	value: unknown,
	options: Record<string, unknown>
): string {
	if (value === null || value === undefined) return "∅";

	const num = Number(value);
	if (Number.isNaN(num)) return String(value);

	const decimals = (options.decimals as number) ?? 2;
	const prefix = (options.prefix as string) ?? "";
	const suffix = (options.suffix as string) ?? "";
	const thousandsSeparator = (options.thousandsSeparator as string) ?? ",";

	const formatted = num.toFixed(decimals);
	const parts = formatted.split(".");
	parts[0] = (parts[0] ?? "").replace(
		/\B(?=(\d{3})+(?!\d))/g,
		thousandsSeparator
	);

	return `${prefix}${parts.join(".")}${suffix}`;
}

/**
 * Format a boolean value
 */
function formatBoolean(
	value: unknown,
	options: Record<string, unknown>
): string {
	if (value === null || value === undefined) return "∅";

	const trueLabel = (options.trueLabel as string) ?? "✓ Yes";
	const falseLabel = (options.falseLabel as string) ?? "✗ No";

	// Handle various boolean representations
	const boolValue =
		value === true ||
		value === "true" ||
		value === 1 ||
		value === "1" ||
		value === "yes" ||
		value === "YES";

	return boolValue ? trueLabel : falseLabel;
}

/**
 * Format JSON with pretty printing
 */
function formatJson(value: unknown, options: Record<string, unknown>): string {
	if (value === null || value === undefined) return "∅";

	const indent = (options.indent as number) ?? 2;

	try {
		const parsed = typeof value === "string" ? JSON.parse(value) : value;
		return JSON.stringify(parsed, null, indent);
	} catch {
		return String(value);
	}
}

/**
 * Truncate text to a maximum length
 */
function truncateText(
	value: unknown,
	options: Record<string, unknown>
): string {
	if (value === null || value === undefined) return "∅";

	const str = String(value);
	const maxLength = (options.maxLength as number) ?? 50;
	const suffix = (options.suffix as string) ?? "...";

	if (str.length <= maxLength) return str;

	return str.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Mask sensitive data
 */
function maskData(value: unknown, options: Record<string, unknown>): string {
	if (value === null || value === undefined) return "∅";

	const str = String(value);
	const maskChar = (options.maskChar as string) ?? "*";
	const showFirst = (options.showFirst as number) ?? 0;
	const showLast = (options.showLast as number) ?? 4;

	if (str.length <= showFirst + showLast) {
		return maskChar.repeat(str.length);
	}

	const firstPart = str.substring(0, showFirst);
	const lastPart = str.substring(str.length - showLast);
	const maskedLength = str.length - showFirst - showLast;

	return `${firstPart}${maskChar.repeat(maskedLength)}${lastPart}`;
}

/**
 * Apply a single transformation to a value
 */
export function applyTransformation(
	value: unknown,
	type: TransformationType,
	options: Record<string, unknown>
): string {
	switch (type) {
		case "date":
			return formatDate(value, options);
		case "number":
			return formatNumber(value, options);
		case "boolean":
			return formatBoolean(value, options);
		case "json":
			return formatJson(value, options);
		case "truncate":
			return truncateText(value, options);
		case "mask":
			return maskData(value, options);
		case "uppercase":
			return value === null || value === undefined
				? "∅"
				: String(value).toUpperCase();
		case "lowercase":
			return value === null || value === undefined
				? "∅"
				: String(value).toLowerCase();
		case "capitalize": {
			if (value === null || value === undefined) return "∅";
			const str = String(value);
			return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
		}
		case "custom":
			// Custom transformations could be added later
			return String(value ?? "∅");
		default:
			return String(value ?? "∅");
	}
}

/**
 * Apply all transformations to a row
 */
export function applyTransformationsToRow(
	row: Record<string, unknown>,
	transformations: TransformationConfig[]
): Record<string, string> {
	const result: Record<string, string> = {};

	for (const [key, value] of Object.entries(row)) {
		const transformation = transformations.find(
			t => t.columnName === key && t.isEnabled
		);

		if (transformation) {
			result[key] = applyTransformation(
				value,
				transformation.transformationType,
				transformation.options
			);
		} else {
			// Default formatting
			if (value === null || value === undefined) {
				result[key] = "∅";
			} else if (typeof value === "object") {
				result[key] = JSON.stringify(value);
			} else {
				result[key] = String(value);
			}
		}
	}

	return result;
}
