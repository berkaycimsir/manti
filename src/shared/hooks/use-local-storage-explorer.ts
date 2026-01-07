"use client";

import {
	type DbMap,
	type LocalStoreItem,
	STORE_DEFINITIONS,
	countByDatabase,
	createSidebarItem,
	getGlobalStoreSummary,
	getTableStateKeys,
	getTableStoreSummary,
	parseCompositeKey,
} from "@shared/lib/local-storage-utils";
import { resolveDbName } from "@shared/lib/settings-utils";
import { useCallback, useEffect, useState } from "react";
import { api } from "~/trpc/react";

/**
 * Hook for managing local storage explorer data
 */
export function useLocalStorageExplorer() {
	const { data: connections } = api.userData.getDetailedUsage.useQuery(
		undefined,
		{ staleTime: 5 * 60 * 1000 }
	);

	const [dbMap, setDbMap] = useState<DbMap | null>(null);

	const refreshData = useCallback(() => {
		const mapping: DbMap = {};

		const resolveDb = (idOrName: string) =>
			resolveDbName(idOrName, connections);

		const addItem = (
			db: string,
			table: string | null,
			item: LocalStoreItem
		) => {
			if (!mapping[db]) mapping[db] = { name: db, generic: [], tables: {} };
			const dbGroup = mapping[db];
			if (!dbGroup) return;

			if (table) {
				let cleanTable = table;
				if (cleanTable.startsWith(`${db}-`)) {
					cleanTable = cleanTable.slice(db.length + 1);
				}
				const resolved = resolveDb(db);
				if (cleanTable.startsWith(`${resolved}-`)) {
					cleanTable = cleanTable.slice(resolved.length + 1);
				}

				if (!dbGroup.tables[cleanTable]) dbGroup.tables[cleanTable] = [];
				if (!dbGroup.tables[cleanTable]?.some(i => i.key === item.key)) {
					dbGroup.tables[cleanTable]?.push(item);
				}
			} else {
				if (
					!dbGroup.generic.some(
						i => i.key === item.key && i.label === item.label
					)
				) {
					dbGroup.generic.push(item);
				}
			}
		};

		for (const store of STORE_DEFINITIONS) {
			const raw = localStorage.getItem(store.key);
			if (!raw) continue;

			try {
				const parsed = JSON.parse(raw);
				const state = parsed.state;
				if (!state) continue;

				// Handle Global Stores
				if (store.type === "global") {
					const { value, description } = getGlobalStoreSummary(
						store.key,
						state
					);
					addItem("Application Settings", null, {
						key: store.key,
						label: store.label,
						icon: store.icon,
						valueSummary: value,
						storeType: "global",
						description,
					});
					continue;
				}

				// Handle Sidebar
				if (store.key === "sidebar-storage") {
					if (Array.isArray(state.recentPages)) {
						const counts = countByDatabase(state.recentPages, connections);
						for (const [dbname, count] of Object.entries(counts)) {
							const sidebarItem = createSidebarItem("recent", count);
							addItem(dbname, null, {
								key: "sidebar-storage-recent",
								...sidebarItem,
							});
						}
					}
					if (Array.isArray(state.favorites)) {
						const counts = countByDatabase(state.favorites, connections);
						for (const [dbname, count] of Object.entries(counts)) {
							const sidebarItem = createSidebarItem("favorites", count);
							addItem(dbname, null, {
								key: "sidebar-storage-fav",
								...sidebarItem,
							});
						}
					}
					continue;
				}

				// Handle Table Stores
				const stateKeys = getTableStateKeys(state);
				const keysToProcess =
					store.key === "table-storage" && state.columnWidths
						? Object.keys(state.columnWidths)
						: [...stateKeys];

				for (const compositeKey of keysToProcess) {
					const { dbKey, tableKey } = parseCompositeKey(
						compositeKey,
						store.key,
						connections
					);

					if (store.key === "table-storage") {
						if (!mapping[dbKey])
							mapping[dbKey] = { name: dbKey, generic: [], tables: {} };
						const grp = mapping[dbKey];
						if (!grp) continue;
						if (!grp.tables[tableKey]) grp.tables[tableKey] = [];
						const list = grp.tables[tableKey];
						if (!list) continue;

						const existing = list.find(i => i.key === store.key);
						if (!existing) {
							list.push({
								key: store.key,
								label: store.label,
								icon: store.icon,
								valueSummary: "1 col",
								storeType: "table",
								description: "Custom Column Widths",
							});
						} else {
							const c = Number.parseInt(existing.valueSummary) || 0;
							existing.valueSummary = `${c + 1} cols`;
						}
					} else {
						const val =
							getTableStoreSummary(store.key, compositeKey, state) ||
							"Modified";
						addItem(dbKey, tableKey, {
							key: store.key,
							label: store.label,
							icon: store.icon,
							valueSummary: val,
							storeType: "table",
							description:
								store.label === "Density" ? `Density: ${val}` : store.label,
						});
					}
				}
			} catch (e) {
				console.error("Failed to parse", store.key, e);
			}
		}

		setDbMap(mapping);
	}, [connections]);

	// Refresh on connections change
	useEffect(() => {
		refreshData();
	}, [refreshData]);

	// Listen for storage events
	useEffect(() => {
		window.addEventListener("storage", refreshData);
		return () => window.removeEventListener("storage", refreshData);
	}, [refreshData]);

	return { dbMap, connections, refreshData };
}
