/**
 * Input Sanitization Utilities
 *
 * Provides functions to sanitize user input before processing.
 * Use these utilities in tRPC routers and services to prevent
 * SQL injection, XSS, and other injection attacks.
 */

/**
 * Removes or escapes potentially dangerous HTML characters
 */
export function sanitizeHtml(input: string): string {
	return input
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#x27;");
}

/**
 * Removes null bytes and control characters from strings
 */
export function sanitizeString(input: string): string {
	// Remove null bytes
	let sanitized = input.replace(/\0/g, "");

	// Remove control characters except newlines and tabs
	// Using character codes to match control characters (intentional)
	// biome-ignore lint/suspicious/noControlCharactersInRegex: Intentionally matching control characters for sanitization
	sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

	return sanitized.trim();
}

/**
 * Sanitizes SQL identifier (table name, column name)
 * Only allows alphanumeric characters and underscores
 */
export function sanitizeSqlIdentifier(input: string): string {
	// Remove any characters that aren't alphanumeric, underscore, or dash
	const sanitized = input.replace(/[^a-zA-Z0-9_-]/g, "");

	// Ensure it doesn't start with a number
	if (/^[0-9]/.test(sanitized)) {
		return `_${sanitized}`;
	}

	return sanitized;
}

/**
 * Sanitizes a database connection URL
 * Validates format and removes potentially dangerous characters
 */
export function sanitizeConnectionUrl(input: string): string {
	// Basic validation - must start with postgres:// or postgresql://
	if (!input.startsWith("postgres://") && !input.startsWith("postgresql://")) {
		throw new Error("Invalid connection URL format");
	}

	// Remove any shell metacharacters that could be dangerous
	const sanitized = input.replace(/[;&|`$(){}[\]\\]/g, "");

	return sanitized;
}

/**
 * Sanitizes a search/filter query string
 */
export function sanitizeSearchQuery(input: string): string {
	// Remove control characters
	let sanitized = sanitizeString(input);

	// Limit length to prevent DoS
	sanitized = sanitized.slice(0, 1000);

	return sanitized;
}

/**
 * Validates and sanitizes pagination parameters
 */
export function sanitizePagination(
	page: number | undefined,
	limit: number | undefined
): { page: number; limit: number } {
	const sanitizedPage = Math.max(1, Math.floor(page ?? 1));
	const sanitizedLimit = Math.min(1000, Math.max(1, Math.floor(limit ?? 50)));

	return {
		page: sanitizedPage,
		limit: sanitizedLimit,
	};
}

/**
 * Sanitizes an object by applying sanitizeString to all string values
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
	const result = {} as T;

	for (const [key, value] of Object.entries(obj)) {
		if (typeof value === "string") {
			(result as Record<string, unknown>)[key] = sanitizeString(value);
		} else if (
			typeof value === "object" &&
			value !== null &&
			!Array.isArray(value)
		) {
			(result as Record<string, unknown>)[key] = sanitizeObject(
				value as Record<string, unknown>
			);
		} else {
			(result as Record<string, unknown>)[key] = value;
		}
	}

	return result;
}

/**
 * SQL-safe escaping for LIKE patterns
 * Escapes %, _, and \ which are special in SQL LIKE
 */
export function escapeLikePattern(input: string): string {
	return input.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}
