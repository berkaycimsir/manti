import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ViewMode = "tabs" | "kanban";
export type SortOption = "name" | "createdAt" | "lastRunAt" | "rowCount";

interface QueryViewState {
	// Query Page View Mode
	viewMode: ViewMode;
	setViewMode: (mode: ViewMode) => void;

	// Kanban Sort Options
	sortBy: SortOption;
	sortAsc: boolean;
	setSortBy: (option: SortOption) => void;
	setSortAsc: (asc: boolean) => void;
	toggleSort: (option: SortOption) => void;
}

export const useQueryViewStore = create<QueryViewState>()(
	persist(
		set => ({
			viewMode: "kanban",
			setViewMode: mode => set({ viewMode: mode }),

			sortBy: "name",
			sortAsc: true,
			setSortBy: sortBy => set({ sortBy }),
			setSortAsc: sortAsc => set({ sortAsc }),
			toggleSort: option =>
				set(state => {
					if (state.sortBy === option) {
						return { sortAsc: !state.sortAsc };
					}
					return { sortBy: option, sortAsc: true };
				}),
		}),
		{
			name: "query-view-storage",
		}
	)
);
