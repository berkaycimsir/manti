'use client';

import { useParams, usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useSidebarStore } from '~/stores/sidebar-store';

interface UseRecentPageOptions {
  title: string;
  subtitle?: string;
  icon?: string;
}

/**
 * Hook for pages to register themselves in recent pages with specific titles.
 * Call this in page components to add a meaningful entry to recent pages.
 *
 * @example
 * // In query show page
 * useRecentPage({ title: query.name, subtitle: "Query Details", icon: "Code" });
 *
 * // In table view
 * useRecentPage({ title: tableName, subtitle: "Table View", icon: "Table" });
 */
export function useRecentPage({
  title,
  subtitle,
  icon = 'FileText',
}: UseRecentPageOptions) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams();
  const addRecentPage = useSidebarStore((state) => state.addRecentPage);

  const dbname = params?.dbname as string | undefined;

  // Include search params in path to differentiate e.g. /query/new vs /query/new?id=5
  const fullPath = searchParams?.toString()
    ? `${pathname}?${searchParams.toString()}`
    : pathname;

  useEffect(() => {
    if (!pathname || !dbname || !title) return;

    addRecentPage({
      path: fullPath,
      title,
      subtitle,
      icon,
      dbname,
    });
  }, [fullPath, dbname, title, subtitle, icon, addRecentPage, pathname]);
}
