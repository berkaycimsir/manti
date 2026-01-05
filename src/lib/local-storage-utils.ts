"use client";

import type { LucideIcon } from "lucide-react";
import {
	Columns,
	Eye,
	History,
	Home,
	Layout,
	List,
	Menu,
	Palette,
	Settings as SettingsIcon,
	Star,
	Type,
} from "lucide-react";
import type { RouterOutputs } from "~/trpc/react";
import { formatDensity, formatViewMode, resolveDbName } from "./settings-utils";

type Connection = RouterOutputs["userData"]["getDetailedUsage"][number];

export interface LocalStoreItem {
	key: string;
	label: string;
	valueSummary: string;
	icon: LucideIcon;
	storeType: "table" | "global" | "sidebar";
	description?: string;
}

export type DbData = {
	name: string;
	generic: LocalStoreItem[];
	tables: Record<string, LocalStoreItem[]>;
};

export type DbMap = Record<string, DbData>;

// Store type definition
export type StoreType = "table" | "global" | "sidebar";

export interface StoreDefinition {
	key: string;
	label: string;
	icon: LucideIcon;
	type: StoreType;
}

// All storage keys the app uses
export const STORE_DEFINITIONS: StoreDefinition[] = [
	{
		key: "table-density-storage",
		label: "Density",
		icon: Layout,
		type: "table",
	},
	{
		key: "table-options-storage",
		label: "Options",
		icon: SettingsIcon,
		type: "table",
	},
	{
		key: "table-view-mode-storage",
		label: "View Mode",
		icon: Eye,
		type: "table",
	},
	{
		key: "table-column-storage",
		label: "Columns",
		icon: Columns,
		type: "table",
	},
	{
		key: "text-view-options-storage",
		label: "Text Opts",
		icon: Type,
		type: "table",
	},
	{ key: "table-storage", label: "Layout", icon: Columns, type: "table" },
	{ key: "sidebar-storage", label: "Sidebar", icon: Menu, type: "sidebar" },
	{ key: "theme-storage", label: "Theme", icon: Palette, type: "global" },
	{
		key: "global-settings-storage",
		label: "Global Defaults",
		icon: SettingsIcon,
		type: "global",
	},
	{ key: "home-view-storage", label: "Home View", icon: Home, type: "global" },
	{
		key: "query-view-storage",
		label: "Query View",
		icon: List,
		type: "global",
	},
	{
		key: "tables-view-storage",
		label: "Tables List",
		icon: List,
		type: "global",
	},
];

/**
 * Get global store summary based on its state
 */
export function getGlobalStoreSummary(
	storeKey: string,
	state: any
): { value: string; description: string } {
	switch (storeKey) {
		case "theme-storage":
			return {
				value: state.color ? `Color: ${state.color}` : "Default",
				description: "UI Theme Color",
			};
		case "home-view-storage":
			return {
				value: `${formatViewMode(state.viewMode)}, ${state.sortOption}`,
				description: "Dashboard Preference",
			};
		case "tables-view-storage":
			return {
				value: `${formatViewMode(state.viewMode)}, ${state.sortBy}`,
				description: "Tables List Preference",
			};
		case "query-view-storage":
			return {
				value: `${state.viewMode === "kanban" ? "Kanban" : "Tabs"}, Sort: ${state.sortBy}`,
				description: "Query List Preference",
			};
		case "global-settings-storage": {
			const active: string[] = [];
			if (state.defaultDensity !== "default")
				active.push(formatDensity(state.defaultDensity));
			if (state.defaultTableOptions?.zebraStriping) active.push("Zebra");
			if (!state.defaultTableOptions?.showRowNumbers) active.push("No Rows");
			return {
				value: active.join(", ") || "Modified",
				description: "Default Table Settings",
			};
		}
		default:
			return { value: "Modified", description: "Application Setting" };
	}
}

/**
 * Get table store value summary
 */
export function getTableStoreSummary(
	storeKey: string,
	targetKey: string,
	state: any
): string | null {
	if (storeKey === "table-density-storage" && state.densityModes?.[targetKey]) {
		return formatDensity(state.densityModes[targetKey]);
	}
	if (storeKey === "table-view-mode-storage" && state.viewModes?.[targetKey]) {
		return formatViewMode(state.viewModes[targetKey]);
	}
	if (storeKey === "table-options-storage" && state.options?.[targetKey]) {
		const opts = state.options[targetKey];
		const active: string[] = [];
		if (opts.zebraStriping) active.push("Zebra");
		if (opts.showRowNumbers) active.push("Rows");
		if (opts.wordWrap) active.push("Wrap");
		return active.join(", ") || "Modified";
	}
	if (storeKey === "text-view-options-storage" && state.options?.[targetKey]) {
		return `Char Limit: ${state.options[targetKey].maxCharacters}`;
	}
	if (storeKey === "table-column-storage") {
		const hidden = state.hiddenColumns?.[targetKey]?.length || 0;
		const pinned = state.pinnedColumns?.[targetKey]?.length || 0;
		const parts: string[] = [];
		if (hidden > 0) parts.push(`${hidden} hidden`);
		if (pinned > 0) parts.push(`${pinned} pinned`);
		return parts.join(", ") || null;
	}
	return null;
}

/**
 * Parse composite key to extract database and table names
 */
export function parseCompositeKey(
	compositeKey: string,
	storeKey: string,
	connections: Connection[] | undefined
): { dbKey: string; tableKey: string } {
	let dbKey = "Unknown";
	let tableKey = "Unknown";

	if (connections && connections.length > 0) {
		const sortedConns = [...connections].sort(
			(a, b) => b.name.length - a.name.length
		);

		let match = sortedConns.find(c => compositeKey.startsWith(`${c.name}-`));
		let prefixLength = match ? match.name.length : 0;

		if (!match) {
			match = sortedConns.find(c => compositeKey.startsWith(`${c.id}-`));
			prefixLength = match ? String(match.id).length : 0;
		}

		if (match) {
			dbKey = match.name;
			const suffix = compositeKey.slice(prefixLength + 1);

			if (storeKey === "table-storage") {
				const lastDash = suffix.lastIndexOf("-");
				tableKey = lastDash > 0 ? suffix.substring(0, lastDash) : suffix;
			} else {
				tableKey = suffix;
			}

			// Iteratively strip prefixes
			let changed = true;
			while (changed) {
				changed = false;
				if (tableKey.startsWith(`${match.name}-`)) {
					tableKey = tableKey.slice(match.name.length + 1);
					changed = true;
				} else if (tableKey.startsWith(`${match.id}-`)) {
					tableKey = tableKey.slice(String(match.id).length + 1);
					changed = true;
				}
			}
		} else {
			const result = parseKeyWithoutConnections(compositeKey, storeKey);
			dbKey = result.dbKey;
			tableKey = result.tableKey;
		}
	} else {
		const result = parseKeyWithoutConnections(compositeKey, storeKey);
		dbKey = result.dbKey;
		tableKey = result.tableKey;
	}

	return { dbKey, tableKey };
}

function parseKeyWithoutConnections(
	compositeKey: string,
	storeKey: string
): { dbKey: string; tableKey: string } {
	const parts = compositeKey.split("-");
	if (parts.length >= 2) {
		const dbKey = parts[0] || "Unknown";
		let tableKey = parts.slice(1).join("-") || "Unknown";
		if (storeKey === "table-storage" && parts.length > 2) {
			tableKey = parts.slice(1, parts.length - 1).join("-");
		}
		return { dbKey, tableKey };
	}
	return { dbKey: "Unknown", tableKey: compositeKey || "Unknown" };
}

/**
 * Count items by database from an array with dbname property
 */
export function countByDatabase(
	items: any[],
	connections: Connection[] | undefined
): Record<string, number> {
	const counts: Record<string, number> = {};
	for (const item of items) {
		if (item?.dbname) {
			const resolved = resolveDbName(item.dbname, connections);
			counts[resolved] = (counts[resolved] || 0) + 1;
		}
	}
	return counts;
}

/**
 * Create sidebar item for recent pages or favorites
 */
export function createSidebarItem(
	type: "recent" | "favorites",
	count: number
): Omit<LocalStoreItem, "key"> {
	if (type === "recent") {
		return {
			label: "Recent Pages",
			icon: History,
			valueSummary: `${count} pages`,
			storeType: "sidebar",
			description: "History of visited pages",
		};
	}
	return {
		label: "Favorites",
		icon: Star,
		valueSummary: `${count} saved`,
		storeType: "sidebar",
		description: "Pinned shortcuts",
	};
}

/**
 * Get all state keys from a table store state
 */
export function getTableStateKeys(state: any): Set<string> {
	return new Set<string>([
		...Object.keys(state.densityModes || {}),
		...Object.keys(state.viewModes || {}),
		...Object.keys(state.options || {}),
		...Object.keys(state.hiddenColumns || {}),
		...Object.keys(state.pinnedColumns || {}),
	]);
}
