'use client';

import { Clipboard, Code, Eye, Table } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import { cn } from '~/lib/utils';

interface TableInfo {
  name: string;
  schema: string;
  columnCount?: number;
}

interface TableCardProps {
  table: TableInfo;
  dbname: string;
  onPreview?: () => void;
  onQuery?: () => void;
}

export function TableCard({
  table,
  dbname,
  onPreview,
  onQuery,
}: TableCardProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const handleNavigate = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    router.push(
      `/home/${dbname}/${encodeURIComponent(
        table.name
      )}?schema=${encodeURIComponent(table.schema)}`
    );
  };

  const handleCopyName = (e: React.MouseEvent) => {
    e.stopPropagation();
    const qualifiedName = `${table.schema}.${table.name}`;
    navigator.clipboard.writeText(qualifiedName);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleQuery = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onQuery) {
      onQuery();
    } else {
      const returnTo = encodeURIComponent(`/home/${dbname}/tables`);
      router.push(
        `/home/${dbname}/query/new?prefill=${encodeURIComponent(
          `SELECT * FROM ${table.schema}.${table.name} LIMIT 100;`
        )}&returnTo=${returnTo}`
      );
    }
  };

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPreview?.();
  };

  return (
    <Card
      className="group cursor-pointer p-4 transition-all hover:border-primary hover:shadow-md"
      onClick={handleNavigate}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          {/* Table Icon + Name */}
          <div className="mb-2 flex items-center gap-2">
            <Table className="h-4 w-4 shrink-0 text-primary" />
            <h3 className="truncate font-semibold text-foreground">
              {table.name}
            </h3>
          </div>

          {/* Schema Badge */}
          <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-muted-foreground text-xs">
            {table.schema}
          </span>

          {/* Column Count */}
          {table.columnCount !== undefined && (
            <p className="mt-2 text-muted-foreground text-sm">
              {table.columnCount} columns
            </p>
          )}
        </div>
      </div>

      {/* Quick Actions - visible on hover */}
      <div
        className={cn(
          'mt-3 flex items-center gap-1 border-border border-t pt-3',
          'opacity-0 transition-opacity group-hover:opacity-100'
        )}
      >
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePreview}
                className="h-8 w-8 p-0"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Preview</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNavigate}
                className="h-8 w-8 p-0"
              >
                <Table className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>View Data</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleQuery}
                className="h-8 w-8 p-0"
              >
                <Code className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Query</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyName}
                className="h-8 w-8 p-0"
              >
                <Clipboard className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{copied ? 'Copied!' : 'Copy Name'}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </Card>
  );
}
