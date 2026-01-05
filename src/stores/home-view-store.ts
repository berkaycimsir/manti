import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ViewMode = "grid" | "list";
export type SortOption =
	| "name-asc"
	| "name-desc"
	| "created-desc"
	| "created-asc"
	| "last-used-desc"
	| "last-used-asc";

interface HomeViewState {
	viewMode: ViewMode;
	sortOption: SortOption;
	setViewMode: (mode: ViewMode) => void;
	setSortOption: (option: SortOption) => void;
}

export const useHomeViewStore = create<HomeViewState>()(
	persist(
		set => ({
			viewMode: "grid",
			sortOption: "created-desc",
			setViewMode: mode => set({ viewMode: mode }),
			setSortOption: option => set({ sortOption: option }),
		}),
		{
			name: "home-view-storage",
		}
	)
);
