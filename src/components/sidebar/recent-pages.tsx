'use client';

import { Code, FileText, Info, Star, Table } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';
import { type RecentPage, useSidebarStore } from '~/stores/sidebar-store';

// Map icon names to components
const iconMap: Record<string, React.ElementType> = {
  Table,
  Code,
  Info,
  FileText,
};

function formatRelativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function RecentPages() {
  const params = useParams();
  const currentDbname = params?.dbname as string | undefined;

  // Wait for client-side hydration before reading persisted store
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    getRecentPagesForDb,
    getFavoritesForDb,
    clearRecentsForDb,
    toggleFavorite,
    isFavorite,
  } = useSidebarStore();

  // Get database-specific pages (only after mount to avoid hydration mismatch)
  const recentPages =
    mounted && currentDbname ? getRecentPagesForDb(currentDbname) : [];
  const favorites =
    mounted && currentDbname ? getFavoritesForDb(currentDbname) : [];

  if (!currentDbname || (recentPages.length === 0 && favorites.length === 0)) {
    return (
      <div className="flex h-full items-center justify-center px-4 py-2 text-center text-sidebar-foreground/50 text-xs">
        No recent pages yet.
        <br />
        Navigate around to populate this list.
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto px-4 py-2">
      {/* Favorites */}
      {favorites.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 font-semibold text-sidebar-foreground/60 text-xs uppercase tracking-wider">
            Favorites
          </p>
          <div className="space-y-1">
            {favorites.map((page) => (
              <RecentPageItem
                key={page.path}
                page={page}
                isFavorite
                onToggleFavorite={() => toggleFavorite(page)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recent */}
      {recentPages.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="font-semibold text-sidebar-foreground/60 text-xs uppercase tracking-wider">
              Recent
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => clearRecentsForDb(currentDbname)}
              className="h-6 px-2 text-sidebar-foreground/50 text-xs hover:text-sidebar-foreground"
            >
              Clear
            </Button>
          </div>
          <div className="space-y-1">
            {recentPages.map((page) => (
              <RecentPageItem
                key={page.path}
                page={page}
                isFavorite={isFavorite(page.path)}
                onToggleFavorite={() => toggleFavorite(page)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface RecentPageItemProps {
  page: RecentPage;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

function RecentPageItem({
  page,
  isFavorite,
  onToggleFavorite,
}: RecentPageItemProps) {
  const IconComponent = iconMap[page.icon] || FileText;

  return (
    <div className="group relative">
      <Link
        href={page.path}
        className={cn(
          'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
          'text-sidebar-foreground hover:bg-sidebar-accent'
        )}
      >
        <IconComponent className="h-4 w-4 shrink-0 text-sidebar-foreground/70" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{page.title}</p>
          {page.subtitle && (
            <p className="truncate text-sidebar-foreground/50 text-xs">
              {page.subtitle} • {formatRelativeTime(page.visitedAt)}
            </p>
          )}
          {!page.subtitle && (
            <p className="text-sidebar-foreground/50 text-xs">
              {formatRelativeTime(page.visitedAt)}
            </p>
          )}
        </div>
      </Link>
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleFavorite();
        }}
        className={cn(
          '-translate-y-1/2 absolute top-1/2 right-1 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100',
          isFavorite && 'text-yellow-500 opacity-100'
        )}
        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Star className={cn('h-3.5 w-3.5', isFavorite && 'fill-current')} />
      </Button>
    </div>
  );
}
