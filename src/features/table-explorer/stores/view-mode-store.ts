import type { ViewMode } from "@shared/types/table";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ViewModeState {
	viewModes: Record<string, ViewMode>;
	setViewMode: (dbName: string, tableName: string, mode: ViewMode) => void;
	getViewMode: (dbName: string, tableName: string) => ViewMode;
}

export const useTableViewModeStore = create<ViewModeState>()(
	persist(
		(set, get) => ({
			viewModes: {},
			setViewMode: (dbName, tableName, mode) =>
				set(state => ({
					viewModes: {
						...state.viewModes,
						[`${dbName}-${tableName}`]: mode,
					},
				})),
			getViewMode: (dbName, tableName) =>
				get().viewModes[`${dbName}-${tableName}`] ?? "grid",
		}),
		{ name: "table-view-mode-storage" }
	)
);
