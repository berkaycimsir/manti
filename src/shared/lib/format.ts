/**
 * Format a date as a relative time string in the user's timezone
 * Examples: "5 minutes ago", "2 hours ago", "3 days ago", "Oct 28"
 * Accepts Date objects or Unix timestamps (numbers)
 */
export function formatRelativeTime(
	date: Date | number | null | undefined
): string {
	if (!date) return "—";

	const dateObj = typeof date === "number" ? new Date(date) : new Date(date);
	const now = new Date();
	const diffMs = now.getTime() - dateObj.getTime();
	const diffSecs = Math.floor(diffMs / 1000);
	const diffMins = Math.floor(diffSecs / 60);
	const diffHours = Math.floor(diffMins / 60);
	const diffDays = Math.floor(diffHours / 24);

	if (diffMins < 1) return "just now";
	if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
	if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
	if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

	// For dates older than 1 week, show as date
	const formatter = new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		...(dateObj.getFullYear() !== now.getFullYear() && {
			year: "2-digit",
		}),
	});
	return formatter.format(dateObj);
}

/**
 * Format a date as a short date string
 * Example: "Jan 7, 2026"
 */
export function formatDate(date: Date | null | undefined): string {
	if (!date) return "—";

	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	}).format(new Date(date));
}

/**
 * Format a date as a full datetime string
 * Example: "Jan 7, 2026, 3:45 PM"
 */
export function formatDateTime(date: Date | null | undefined): string {
	if (!date) return "—";

	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
	}).format(new Date(date));
}

/**
 * Format bytes into a human-readable string
 * Example: "1.5 MB"
 */
export function formatBytes(bytes: number): string {
	if (bytes === 0) return "0 B";

	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB", "TB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}
