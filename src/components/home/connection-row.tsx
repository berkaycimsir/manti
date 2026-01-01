'use client';

import {
  Database,
  Edit2,
  MoreHorizontal,
  RefreshCw,
  Trash2,
  Unplug,
} from 'lucide-react';
import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '~/components/ui/dropdown-menu';
import { cn, formatRelativeTime } from '~/lib/utils';
import { api } from '~/trpc/react';
import type { Connection } from './connection-card';

interface ConnectionRowProps {
  connection: Connection;
  onSelect: (id: number) => void;
  onReconnect: () => void;
  onClose: () => void;
  onDelete: () => void;
  onEdit?: () => void;
  isLoading?: boolean;
  isReconnecting?: boolean;
  isClosing?: boolean;
  isDeleting?: boolean;
}

export function ConnectionRow({
  connection,
  onSelect,
  onReconnect,
  onClose,
  onDelete,
  onEdit,
  isReconnecting,
  isClosing,
  isDeleting,
}: ConnectionRowProps) {
  const { data: stats } = api.database.getConnectionStats.useQuery(
    { connectionId: connection.id },
    { enabled: connection.isActive === true }
  );

  const lastUsed = connection.lastUsedAt
    ? formatRelativeTime(connection.lastUsedAt)
    : null;

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'flex cursor-pointer items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors',
        'hover:border-primary hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary'
      )}
      onClick={() => onSelect(connection.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(connection.id);
        }
      }}
    >
      {/* Icon */}
      <Database
        className={cn(
          'h-5 w-5 shrink-0',
          connection.isActive ? 'text-primary' : 'text-muted-foreground'
        )}
      />

      {/* Connection Info */}
      <div className="grid min-w-0 flex-1 grid-cols-12 items-center gap-4">
        <div className="col-span-4 flex items-center gap-2">
          <h3 className="truncate font-semibold text-foreground">
            {connection.name}
          </h3>
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-muted-foreground text-xs">
            {connection.database || 'No DB'}
          </span>
        </div>

        <div className="col-span-3 text-muted-foreground text-sm">
          {connection.host || 'local'}
        </div>

        <div className="col-span-2 text-muted-foreground text-sm">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                connection.isActive ? 'bg-green-500' : 'bg-red-500'
              )}
            />
            <span>{connection.isActive ? 'Active' : 'Inactive'}</span>
          </div>
        </div>

        <div className="relative col-span-3 pr-4 text-right text-muted-foreground text-sm">
          {connection.isActive && stats ? (
            <span>{stats.tableCount} tables</span>
          ) : (
            <span>{lastUsed ? `Used ${lastUsed}` : 'Never used'}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div
        className="flex shrink-0 items-center justify-end"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onSelect(connection.id)}>
              <Database className="mr-2 h-4 w-4" />
              Open Database
            </DropdownMenuItem>

            {!connection.isActive && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault();
                  onReconnect();
                }}
                disabled={isReconnecting}
              >
                <RefreshCw
                  className={cn(
                    'mr-2 h-4 w-4 text-blue-500',
                    isReconnecting && 'animate-spin'
                  )}
                />
                Reconnect
              </DropdownMenuItem>
            )}

            {connection.isActive && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault();
                  onClose();
                }}
                disabled={isClosing}
              >
                <Unplug className="mr-2 h-4 w-4 text-orange-500" />
                Close Connection
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => onEdit?.()}>
              <Edit2 className="mr-2 h-4 w-4" />
              Edit Connection
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault();
                onDelete();
              }}
              disabled={isDeleting}
              className="text-destructive focus:text-destructive"
            >
              <Trash2
                className={cn('mr-2 h-4 w-4', isDeleting && 'animate-spin')}
              />
              Delete Connection
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
