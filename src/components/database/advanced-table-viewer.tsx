'use client';

import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Grid3x3,
  Rows,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '~/components/ui/button';
import { Checkbox } from '~/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover';
import { cn } from '~/lib/utils';

interface Column {
  name: string;
  type: string;
}

interface Row {
  [key: string]: unknown;
}

interface AdvancedTableViewerProps {
  tableName: string;
  columns: Column[];
  rows: Row[];
}

function TruncatedCell({
  value,
  maxLines = 2,
}: {
  value: string;
  maxLines?: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isTruncated = value.split('\n').length > maxLines || value.length > 100;

  if (!isTruncated) {
    return <div className="line-clamp-2 text-sm">{value}</div>;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="line-clamp-2 cursor-help text-sm hover:underline hover:underline-offset-2">
          {value}
        </div>
      </PopoverTrigger>
      <PopoverContent className="max-h-96 w-96 overflow-y-auto">
        <div className="space-y-2">
          <p className="font-semibold text-foreground text-sm">Full Content</p>
          <div className="wrap-anywhere whitespace-pre-wrap rounded border border-border bg-muted/30 p-3 font-mono text-sm">
            {value}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function AdvancedTableViewer({
  tableName,
  columns,
  rows,
}: AdvancedTableViewerProps) {
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(columns.map((c) => c.name))
  );
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'transpose'>('grid');
  const [columnWidths] = useState<Record<string, number>>({});
  const [sortConfig, setSortConfig] = useState<{
    column: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  const visibleColumnsArray = useMemo(
    () => columns.filter((c) => visibleColumns.has(c.name)),
    [columns, visibleColumns]
  );

  const sortedRows = useMemo(() => {
    const sorted = [...rows];
    if (sortConfig) {
      sorted.sort((a, b) => {
        const aVal = a[sortConfig.column];
        const bVal = b[sortConfig.column];
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sorted;
  }, [rows, sortConfig]);

  const toggleColumnVisibility = (columnName: string) => {
    const newVisible = new Set(visibleColumns);
    if (newVisible.has(columnName)) {
      newVisible.delete(columnName);
    } else {
      newVisible.add(columnName);
    }
    setVisibleColumns(newVisible);
  };

  const toggleRowExpansion = (rowIndex: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowIndex)) {
      newExpanded.delete(rowIndex);
    } else {
      newExpanded.add(rowIndex);
    }
    setExpandedRows(newExpanded);
  };

  const toggleRowSelection = (rowIndex: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(rowIndex)) {
      newSelected.delete(rowIndex);
    } else {
      newSelected.add(rowIndex);
    }
    setSelectedRows(newSelected);
  };

  const toggleAllRows = () => {
    if (selectedRows.size === sortedRows.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(sortedRows.map((_, i) => i)));
    }
  };

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return '∅';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const getRowKey = (row: Row, index: number): string => {
    // Try to use a unique identifier from the row
    const id = row.id ?? row._id ?? row.uuid ?? row.key;
    if (id !== undefined && id !== null) return String(id);
    return `row-${index}`;
  };

  // Grid View
  const GridView = () => (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-border border-b bg-muted/50">
              <th className="w-12 px-4 py-3 text-left">
                <Checkbox
                  checked={
                    selectedRows.size === sortedRows.length &&
                    sortedRows.length > 0
                  }
                  onCheckedChange={toggleAllRows}
                />
              </th>
              <th className="w-12 px-4 py-3 text-left">Expand</th>
              {visibleColumnsArray.map((col) => (
                <th
                  key={col.name}
                  className="group relative border-border border-r px-4 py-3 text-left font-semibold text-foreground last:border-r-0"
                  style={{ minWidth: columnWidths[col.name] || 150 }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="truncate">{col.name}</span>
                      <span className="font-normal text-muted-foreground text-xs">
                        {col.type}
                      </span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => toggleColumnVisibility(col.name)}
                        >
                          <EyeOff className="mr-2 h-4 w-4" />
                          Hide Column
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            const newSort =
                              sortConfig?.column === col.name &&
                              sortConfig.direction === 'asc'
                                ? {
                                    column: col.name,
                                    direction: 'desc' as const,
                                  }
                                : {
                                    column: col.name,
                                    direction: 'asc' as const,
                                  };
                            setSortConfig(newSort);
                          }}
                        >
                          {sortConfig?.column === col.name &&
                          sortConfig.direction === 'asc' ? (
                            <ChevronUp className="mr-2 h-4 w-4" />
                          ) : (
                            <ChevronDown className="mr-2 h-4 w-4" />
                          )}
                          Sort
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, rowIndex) => {
              const rowKey = getRowKey(row, rowIndex);
              return (
                <>
                  <tr
                    key={rowKey}
                    className={cn(
                      'border-border border-b transition-colors hover:bg-muted/30',
                      selectedRows.has(rowIndex) && 'bg-muted/50'
                    )}
                  >
                    <td className="w-12 px-4 py-3">
                      <Checkbox
                        checked={selectedRows.has(rowIndex)}
                        onCheckedChange={() => toggleRowSelection(rowIndex)}
                      />
                    </td>
                    <td className="w-12 px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => toggleRowExpansion(rowIndex)}
                      >
                        {expandedRows.has(rowIndex) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </td>
                    {visibleColumnsArray.map((col) => (
                      <td
                        key={`${rowKey}-${col.name}`}
                        className="wrap-anywhere max-w-xs border-border border-r px-4 py-3 last:border-r-0"
                        style={{ minWidth: columnWidths[col.name] || 150 }}
                      >
                        <div className="line-clamp-3 text-sm">
                          {formatValue(row[col.name])}
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Expanded Row Detail View */}
                  {expandedRows.has(rowIndex) && (
                    <tr
                      key={`expanded-${rowKey}`}
                      className="border-border border-b bg-muted/20"
                    >
                      <td
                        colSpan={2 + visibleColumnsArray.length}
                        className="px-4 py-4"
                      >
                        <div className="space-y-3">
                          <div className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                            Row Details
                          </div>
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {visibleColumnsArray.map((col) => (
                              <div
                                key={`detail-${rowKey}-${col.name}`}
                                className="rounded border border-border bg-background p-3"
                              >
                                <div className="mb-1 font-semibold text-muted-foreground text-xs">
                                  {col.name}
                                </div>
                                <div className="mb-2 text-muted-foreground text-xs">
                                  Type: {col.type}
                                </div>
                                <div className="wrap-anywhere whitespace-pre-wrap rounded bg-muted/30 p-2 font-mono text-sm">
                                  {formatValue(row[col.name])}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const TransposeView = () => (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-border border-b bg-muted/50">
              <th className="min-w-40 border-border border-r px-4 py-3 text-left font-semibold text-foreground">
                Field Name
              </th>
              {sortedRows.slice(0, 10).map((row, colIndex) => (
                <th
                  key={getRowKey(row, colIndex)}
                  className="min-w-32 border-border border-r px-4 py-3 text-left font-semibold text-foreground last:border-r-0"
                >
                  Row {colIndex + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleColumnsArray.map((col) => (
              <tr
                key={`field-${col.name}`}
                className="border-border border-b transition-colors hover:bg-muted/30"
              >
                <td className="border-border border-r bg-muted/20 px-4 py-3 font-semibold text-foreground">
                  <div className="flex flex-col">
                    <span className="truncate">{col.name}</span>
                    <span className="font-normal text-muted-foreground text-xs">
                      {col.type}
                    </span>
                  </div>
                </td>
                {sortedRows.slice(0, 10).map((row, rowIndex) => (
                  <td
                    key={`transpose-${col.name}-${getRowKey(row, rowIndex)}`}
                    className="wrap-anywhere max-w-xs border-border border-r px-4 py-3 last:border-r-0"
                  >
                    <TruncatedCell
                      value={formatValue(row[col.name])}
                      maxLines={2}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-foreground text-xl">{tableName}</h2>
          <p className="text-muted-foreground text-sm">
            {sortedRows.length} rows • {visibleColumnsArray.length} of{' '}
            {columns.length} columns visible
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Column Visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 bg-transparent"
              >
                <Eye className="h-4 w-4" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {columns.map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.name}
                  checked={visibleColumns.has(col.name)}
                  onCheckedChange={() => toggleColumnVisibility(col.name)}
                >
                  {col.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border border-border p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              className="gap-2"
              onClick={() => setViewMode('grid')}
            >
              <Grid3x3 className="h-4 w-4" />
              Grid
            </Button>
            <Button
              variant={viewMode === 'transpose' ? 'default' : 'ghost'}
              size="sm"
              className="gap-2"
              onClick={() => setViewMode('transpose')}
            >
              <Rows className="h-4 w-4" />
              Transpose
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      {viewMode === 'grid' ? <GridView /> : <TransposeView />}

      {/* Footer */}
      <div className="flex items-center justify-between text-muted-foreground text-sm">
        <div>
          {selectedRows.size > 0 && (
            <span>{selectedRows.size} row(s) selected</span>
          )}
        </div>
        <div className="text-xs">
          Showing {Math.min(100, sortedRows.length)} of {sortedRows.length} rows
        </div>
      </div>
    </div>
  );
}
