import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface RecentPage {
  path: string;
  title: string;
  subtitle?: string; // e.g., "Query Details" or "Edit Query"
  icon: string; // lucide icon name
  visitedAt: number;
  dbname: string; // database this page belongs to
}

interface SidebarState {
  // Recent pages (keyed by dbname internally, but stored flat for simplicity)
  recentPages: RecentPage[];
  addRecentPage: (page: Omit<RecentPage, 'visitedAt'>) => void;
  getRecentPagesForDb: (dbname: string) => RecentPage[];
  clearRecentsForDb: (dbname: string) => void;

  // Favorites (also database-specific)
  favorites: RecentPage[];
  toggleFavorite: (page: Omit<RecentPage, 'visitedAt'>) => void;
  isFavorite: (path: string) => boolean;
  getFavoritesForDb: (dbname: string) => RecentPage[];
}

const MAX_RECENT_PAGES_PER_DB = 8;
const MAX_FAVORITES = 10;

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set, get) => ({
      recentPages: [],
      favorites: [],

      addRecentPage: (page) =>
        set((state) => {
          // Remove existing entry for this path
          const filtered = state.recentPages.filter(
            (p) => p.path !== page.path
          );
          // Add new entry at the beginning
          const newPage: RecentPage = { ...page, visitedAt: Date.now() };
          const allPages = [newPage, ...filtered];

          // Keep only MAX_RECENT_PAGES_PER_DB per database
          const byDb: Record<string, RecentPage[]> = {};
          for (const p of allPages) {
            if (!byDb[p.dbname]) byDb[p.dbname] = [];
            const dbPages = byDb[p.dbname];
            if (dbPages && dbPages.length < MAX_RECENT_PAGES_PER_DB) {
              dbPages.push(p);
            }
          }

          return { recentPages: Object.values(byDb).flat() };
        }),

      getRecentPagesForDb: (dbname) =>
        get()
          .recentPages.filter((p) => p.dbname === dbname)
          .sort((a, b) => b.visitedAt - a.visitedAt),

      clearRecentsForDb: (dbname) =>
        set((state) => ({
          recentPages: state.recentPages.filter((p) => p.dbname !== dbname),
        })),

      toggleFavorite: (page) =>
        set((state) => {
          const exists = state.favorites.some((f) => f.path === page.path);
          if (exists) {
            return {
              favorites: state.favorites.filter((f) => f.path !== page.path),
            };
          }
          if (state.favorites.length >= MAX_FAVORITES) {
            return state;
          }
          return {
            favorites: [...state.favorites, { ...page, visitedAt: Date.now() }],
          };
        }),

      isFavorite: (path) => get().favorites.some((f) => f.path === path),

      getFavoritesForDb: (dbname) =>
        get().favorites.filter((p) => p.dbname === dbname),
    }),
    {
      name: 'sidebar-storage',
    }
  )
);
