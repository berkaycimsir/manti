/**
 * Check if the application is running in a production environment (e.g., Vercel)
 */
export function isProduction(): boolean {
	if (typeof window === "undefined")
		return process.env.NODE_ENV === "production";
	return (
		window.location.hostname !== "localhost" &&
		window.location.hostname !== "127.0.0.1" &&
		!window.location.hostname.endsWith(".local")
	);
}

/**
 * Check if a database connection is considered "local" to the user's machine
 */
export function isLocalConnection(host: string | null): boolean {
	if (!host) return false; // Don't assume local if host is missing
	const localHosts = ["localhost", "127.0.0.1", "::1", "0.0.0.0"];
	return localHosts.includes(host.toLowerCase()) || host.endsWith(".local");
}
