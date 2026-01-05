"use client";

import { useCallback } from "react";
import type { LocalStoreItem } from "~/lib/local-storage-utils";
import type { RouterOutputs } from "~/trpc/react";

// Store imports for reset functionality
import { useGlobalSettingsStore } from "~/stores/global-settings-store";
import { useHomeViewStore } from "~/stores/home-view-store";
import { useQueryViewStore } from "~/stores/query-view-store";
import { useSidebarStore } from "~/stores/sidebar-store";
import { useTableStore } from "~/stores/table-store";
import {
	useTableColumnStore,
	useTableDensityStore,
	useTableOptionsStore,
	useTableViewModeStore,
	useTextViewOptionsStore,
} from "~/stores/table-view-store";
import { useTablesViewStore } from "~/stores/tables-view-store";
import { useThemeStore } from "~/stores/theme-store";

type Connection = RouterOutputs["userData"]["getDetailedUsage"][number];

// Map store keys to actual Zustand stores
const STORE_MAP: Record<string, any> = {
	"table-density-storage": useTableDensityStore,
	"table-options-storage": useTableOptionsStore,
	"table-view-mode-storage": useTableViewModeStore,
	"table-column-storage": useTableColumnStore,
	"text-view-options-storage": useTextViewOptionsStore,
	"table-storage": useTableStore,
	"sidebar-storage": useSidebarStore,
	"theme-storage": useThemeStore,
	"global-settings-storage": useGlobalSettingsStore,
	"home-view-storage": useHomeViewStore,
	"query-view-storage": useQueryViewStore,
	"tables-view-storage": useTablesViewStore,
};

/**
 * Reset global store to default values
 */
function resetGlobalStore(itemKey: string, store: any) {
	switch (itemKey) {
		case "theme-storage":
			store.setState({ color: "zinc" });
			break;
		case "home-view-storage":
			store.setState({ viewMode: "grid", sortOption: "created-desc" });
			break;
		case "tables-view-storage":
			store.setState({
				viewMode: "grid",
				sortBy: "name",
				sortOrder: "asc",
				groupBySchema: false,
			});
			break;
		case "query-view-storage":
			store.setState({ viewMode: "kanban", sortBy: "name", sortAsc: true });
			break;
		case "global-settings-storage":
			store.setState({
				defaultDensity: "default",
				defaultTableOptions: {
					showRowNumbers: true,
					zebraStriping: true,
					wordWrap: false,
					showNullDistinct: true,
					fullWidth: false,
				},
			});
			break;
	}
}

/**
 * Reset sidebar store entries for a specific database
 */
function resetSidebarStore(
	itemKey: string,
	dbKey: string,
	connections: Connection[] | undefined,
	store: any
) {
	store.setState((state: any) => {
		const newState = { ...state };
		const filterByDb = (items: any[]) =>
			items.filter((p: any) => {
				const resolved = p.dbname
					? connections?.find(
							c => c.name === p.dbname || c.id.toString() === p.dbname
						)?.name || p.dbname
					: "";
				return resolved !== dbKey;
			});

		if (itemKey === "sidebar-storage-recent") {
			newState.recentPages = filterByDb(state.recentPages || []);
		}
		if (itemKey === "sidebar-storage-fav") {
			newState.favorites = filterByDb(state.favorites || []);
		}
		return newState;
	});
}

/**
 * Reset table-specific store entries
 */
function resetTableStore(dbKey: string, tableKey: string, store: any) {
	store.setState((state: any) => {
		const newState = { ...state };
		const cleanMap = (mapName: string) => {
			if (!newState[mapName]) return;
			const map = { ...newState[mapName] };
			let modified = false;
			const exactTarget = `${dbKey}-${tableKey}`;
			for (const key of Object.keys(map)) {
				if (key === exactTarget || key.startsWith(`${exactTarget}-`)) {
					delete map[key];
					modified = true;
				}
			}
			if (modified) newState[mapName] = map;
		};

		cleanMap("densityModes");
		cleanMap("viewModes");
		cleanMap("options");
		cleanMap("hiddenColumns");
		cleanMap("pinnedColumns");
		cleanMap("columnWidths");
		cleanMap("rowHeights");

		return newState;
	});
}

/**
 * Hook for resetting local storage items
 */
export function useLocalStorageReset(
	connections: Connection[] | undefined,
	refreshData: () => void
) {
	const handleReset = useCallback(
		(dbKey: string, tableKey: string | null, item: LocalStoreItem) => {
			const storeKey =
				item.key === "sidebar-storage-recent" ||
				item.key === "sidebar-storage-fav"
					? "sidebar-storage"
					: item.key;
			const store = STORE_MAP[storeKey];

			if (!store) return;

			if (item.storeType === "global") {
				resetGlobalStore(item.key, store);
			} else if (item.storeType === "sidebar") {
				resetSidebarStore(item.key, dbKey, connections, store);
			} else if (tableKey) {
				resetTableStore(dbKey, tableKey, store);
			}

			setTimeout(refreshData, 100);
		},
		[connections, refreshData]
	);

	return { handleReset };
}
