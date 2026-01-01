'use client';

import {
  Database,
  Edit2,
  MoreVertical,
  RefreshCw,
  Trash2,
  Unplug,
} from 'lucide-react';
import { Card } from '~/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { formatRelativeTime } from '~/lib/utils';
import { api } from '~/trpc/react';
import { ConnectionCardSkeleton } from '~/components/ui/content-skeletons';

export interface Connection {
  id: number;
  name: string;
  connectionType: 'connection_string' | 'manual';
  host: string | null;
  port: number | null;
  username: string | null;
  database: string | null;
  isActive: boolean | null;
  createdAt: Date | null;
  lastUsedAt?: Date | null;
}

interface ConnectionCardProps {
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

export function ConnectionCard({
  connection,
  onSelect,
  onReconnect,
  onClose,
  onDelete,
  onEdit,
  isLoading: isLoadingDatabases,
  isReconnecting,
  isClosing,
  isDeleting,
}: ConnectionCardProps) {
  const { data: stats, isLoading: isLoadingStats } =
    api.database.getConnectionStats.useQuery(
      { connectionId: connection.id },
      { enabled: connection.isActive === true }
    );

  const isLoading = connection.isActive === true && isLoadingStats;
  const lastUsed = connection.lastUsedAt
    ? formatRelativeTime(connection.lastUsedAt)
    : null;

  if (isLoading) {
    return <ConnectionCardSkeleton />;
  }

  return (
    <Card
      className="group flex h-full cursor-pointer flex-col p-5 transition-shadow hover:shadow-md"
      onClick={() => onSelect(connection.id)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-1.5">
            <Database className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-foreground text-md leading-tight">
              {connection.name}
            </h3>
            <p className="truncate text-muted-foreground text-xs">
              {connection.database}
            </p>
          </div>
        </div>
        <div
          className="opacity-0 transition-opacity group-hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="rounded p-1 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onSelect(connection.id)}>
                <Database className="mr-2 h-4 w-4" />
                Open Database
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit?.()}>
                <Edit2 className="mr-2 h-4 w-4" />
                Edit Connection
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Connection
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex-1">
        <div className="mb-2 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Type:</span>
            <span className="font-mono text-foreground">
              {connection.connectionType === 'connection_string'
                ? 'Connection String'
                : 'Manual'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Created:</span>
            <span className="font-mono text-foreground">
              {connection.createdAt
                ? formatRelativeTime(connection.createdAt)
                : '-'}
            </span>
          </div>
          {lastUsed && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Used:</span>
              <span className="font-mono text-foreground">{lastUsed}</span>
            </div>
          )}
          {connection.isActive && stats && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tables:</span>
              <span className="font-mono text-foreground">
                {stats.tableCount}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status:</span>
            <div className="flex items-center gap-2">
              <div
                className={`h-1.5 w-1.5 rounded-full ${
                  connection.isActive ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span
                className={`rounded-full px-1.5 py-0 font-mono font-semibold text-[10px] uppercase ${
                  connection.isActive
                    ? 'bg-green-500/10 text-green-500'
                    : 'bg-red-500/10 text-red-500'
                }`}
              >
                {connection.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between border-border border-t pt-3">
        <div className="flex gap-1">
          {!connection.isActive && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onReconnect();
              }}
              disabled={isReconnecting}
              className="rounded p-1 transition-colors hover:bg-blue-500/10 disabled:opacity-50"
              title="Reconnect"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-blue-500 ${
                  isReconnecting || isLoadingDatabases ? 'animate-spin' : ''
                }`}
              />
            </button>
          )}
          {connection.isActive && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              disabled={isClosing}
              className="rounded p-1 transition-colors hover:bg-orange-500/10 disabled:opacity-50"
              title="Close"
            >
              <Unplug className="h-3.5 w-3.5 text-red-500" />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.();
            }}
            className="rounded p-1 transition-colors hover:bg-muted"
            title="Edit"
          >
            <Edit2 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            disabled={isDeleting}
            className="rounded p-1 transition-colors hover:bg-destructive/10"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
          </button>
        </div>
      </div>
    </Card>
  );
}
