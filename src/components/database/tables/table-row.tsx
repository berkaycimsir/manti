'use client';

import { Clipboard, Code, Eye, MoreHorizontal, Table } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';

interface TableInfo {
  name: string;
  schema: string;
  columnCount?: number;
}

interface TableRowProps {
  table: TableInfo;
  dbname: string;
  onPreview?: () => void;
}

export function TableRow({ table, dbname, onPreview }: TableRowProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const handleNavigate = (e?: React.MouseEvent | React.KeyboardEvent) => {
    e?.stopPropagation();
    router.push(
      `/home/${dbname}/${encodeURIComponent(
        table.name
      )}?schema=${encodeURIComponent(table.schema)}`
    );
  };

  const handleCopyName = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const qualifiedName = `${table.schema}.${table.name}`;
    navigator.clipboard.writeText(qualifiedName);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleQuery = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const returnTo = encodeURIComponent(`/home/${dbname}/tables`);
    router.push(
      `/home/${dbname}/query/new?prefill=${encodeURIComponent(
        `SELECT * FROM ${table.schema}.${table.name} LIMIT 100;`
      )}&returnTo=${returnTo}`
    );
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className="flex cursor-pointer items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary"
      onClick={handleNavigate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleNavigate();
        }
      }}
    >
      {/* Icon */}
      <Table className="h-5 w-5 shrink-0 text-primary" />

      {/* Table Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-semibold text-foreground">
            {table.name}
          </h3>
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-muted-foreground text-xs">
            {table.schema}
          </span>
        </div>
      </div>

      {/* Column Count */}
      {table.columnCount !== undefined && (
        <span className="shrink-0 text-muted-foreground text-sm">
          {table.columnCount} columns
        </span>
      )}

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onPreview?.();
          }}
          className="h-8 w-8 p-0"
          title="Preview"
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleQuery();
          }}
          className="h-8 w-8 p-0"
          title="Query"
        >
          <Code className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => e.stopPropagation()}
              className="h-8 w-8 p-0"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleNavigate}>
              <Table className="mr-2 h-4 w-4" />
              View Data
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleQuery}>
              <Code className="mr-2 h-4 w-4" />
              Open in Query Editor
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopyName}>
              <Clipboard className="mr-2 h-4 w-4" />
              {copied ? 'Copied!' : 'Copy Table Name'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
