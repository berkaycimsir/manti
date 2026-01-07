"use client";

import type { RouterOutputs } from "~/trpc/react";

type Connection = RouterOutputs["userData"]["getDetailedUsage"][number];

/**
 * Resolve a connection identifier (ID or name) to the connection name.
 * Handles strict matches and prefix-based matches.
 */
export function resolveDbName(
	idOrName: string,
	connections: Connection[] | undefined
): string {
	if (!connections) return idOrName;

	// Try strict match
	let match = connections.find(
		c => c.name === idOrName || c.id.toString() === idOrName
	);
	if (match) return match.name;

	// Try prefix match (ID-Name or Name-ID)
	match = connections.find(
		c => idOrName.startsWith(`${c.id}-`) || idOrName.startsWith(`${c.name}-`)
	);
	return match ? match.name : idOrName;
}

/**
 * Resolve override label for display (strips ID and name prefixes iteratively).
 */
export function resolveOverrideLabel(
	key: string,
	connections: Connection[] | undefined
): string {
	if (!connections) return key.replace("-", " > ");

	let match = connections.find(c => key.startsWith(`${c.name}-`));
	let prefixLen = match ? match.name.length : 0;

	if (!match) {
		match = connections.find(c => key.startsWith(`${c.id}-`));
		prefixLen = match ? String(match.id).length : 0;
	}

	if (match) {
		let suffix = key.slice(prefixLen + 1);
		let changed = true;
		while (changed) {
			changed = false;
			if (suffix.startsWith(`${match.name}-`)) {
				suffix = suffix.slice(match.name.length + 1);
				changed = true;
			} else if (suffix.startsWith(`${match.id}-`)) {
				suffix = suffix.slice(String(match.id).length + 1);
				changed = true;
			}
		}
		return `${match.name} > ${suffix}`;
	}

	return key.replace("-", " > ");
}

/**
 * Iteratively strip ID and name prefixes from a key until clean.
 */
export function stripPrefixes(
	key: string,
	match: { id: number; name: string }
): string {
	let result = key;
	let changed = true;
	while (changed) {
		changed = false;
		if (result.startsWith(`${match.name}-`)) {
			result = result.slice(match.name.length + 1);
			changed = true;
		} else if (result.startsWith(`${match.id}-`)) {
			result = result.slice(String(match.id).length + 1);
			changed = true;
		}
	}
	return result;
}

/**
 * Format density value for display.
 */
export function formatDensity(val: string): string {
	return val.charAt(0).toUpperCase() + val.slice(1);
}

/**
 * Format view mode value for display.
 */
export function formatViewMode(val: string): string {
	return val === "grid" ? "Grid" : val === "text" ? "Text" : "Transpose";
}

/**
 * Calculate total localStorage usage in bytes.
 */
export function calculateLocalStorageSize(): number {
	let total = 0;
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (key) {
			const value = localStorage.getItem(key);
			if (value) {
				total += key.length + value.length;
			}
		}
	}
	return total * 2; // UTF-16 encoding
}

/**
 * List of all known storage keys used by the app.
 */
export const STORAGE_KEYS = [
	{ key: "theme-storage", label: "Theme Settings" },
	{ key: "global-settings-storage", label: "Global Defaults" },
	{ key: "home-view-storage", label: "Home View Settings" },
	{ key: "query-view-storage", label: "Query View Settings" },
	{ key: "tables-view-storage", label: "Tables List Settings" },
	{ key: "sidebar-storage", label: "Sidebar History" },
	{ key: "table-density-storage", label: "Table Density" },
	{ key: "table-options-storage", label: "Table Options" },
	{ key: "table-view-mode-storage", label: "Table View Modes" },
	{ key: "table-column-storage", label: "Table Column State" },
	{ key: "text-view-options-storage", label: "Text View Options" },
	{ key: "table-storage", label: "Table Layout (Widths)" },
] as const;
