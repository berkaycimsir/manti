import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TablesViewMode = 'grid' | 'list';
export type TablesSortBy = 'name' | 'columns' | 'schema';
export type TablesSortOrder = 'asc' | 'desc';

interface TablesViewState {
  // View preferences
  viewMode: TablesViewMode;
  setViewMode: (mode: TablesViewMode) => void;

  // Sorting
  sortBy: TablesSortBy;
  sortOrder: TablesSortOrder;
  setSortBy: (sortBy: TablesSortBy) => void;
  toggleSortOrder: () => void;

  // Grouping
  groupBySchema: boolean;
  setGroupBySchema: (group: boolean) => void;

  // Collapsed schemas (for grouping)
  collapsedSchemas: string[];
  toggleSchemaCollapse: (schema: string) => void;
}

export const useTablesViewStore = create<TablesViewState>()(
  persist(
    (set) => ({
      viewMode: 'grid',
      sortBy: 'name',
      sortOrder: 'asc',
      groupBySchema: false,
      collapsedSchemas: [],

      setViewMode: (mode) => set({ viewMode: mode }),

      setSortBy: (sortBy) => set({ sortBy }),

      toggleSortOrder: () =>
        set((state) => ({
          sortOrder: state.sortOrder === 'asc' ? 'desc' : 'asc',
        })),

      setGroupBySchema: (group) => set({ groupBySchema: group }),

      toggleSchemaCollapse: (schema) =>
        set((state) => {
          const isCollapsed = state.collapsedSchemas.includes(schema);
          return {
            collapsedSchemas: isCollapsed
              ? state.collapsedSchemas.filter((s) => s !== schema)
              : [...state.collapsedSchemas, schema],
          };
        }),
    }),
    {
      name: 'tables-view-storage',
    }
  )
);
