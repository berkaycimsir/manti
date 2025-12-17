'use client';

import {
  AlignJustify,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronUp,
  Clipboard,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileJson,
  FileSpreadsheet,
  Filter,
  Grid3x3,
  Hash,
  Maximize2,
  Minimize2,
  Pin,
  PinOff,
  Rows,
  Search,
  Settings2,
  Sparkles,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '~/components/ui/button';
import { Checkbox } from '~/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { Input } from '~/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover';
import {
  type TransformationConfig,
  applyTransformation,
} from '~/lib/transformations';
import { cn } from '~/lib/utils';
import { type FilterConfig, applyFilter } from './filter-sidebar';

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
  transformations?: TransformationConfig[];
  filters?: FilterConfig[];
}

type DensityMode = 'compact' | 'default' | 'comfortable';
type ViewMode = 'grid' | 'transpose';

// Column statistics calculations
interface ColumnStats {
  count: number;
  nullCount: number;
  uniqueCount: number;
  // For numeric columns
  sum?: number;
  avg?: number;
  min?: number | string;
  max?: number | string;
}

function calculateColumnStats(
  rows: Row[],
  columnName: string,
  columnType: string
): ColumnStats {
  const values = rows.map((r) => r[columnName]);
  const nonNullValues = values.filter((v) => v !== null && v !== undefined);
  const uniqueValues = new Set(nonNullValues.map((v) => String(v)));

  const stats: ColumnStats = {
    count: values.length,
    nullCount: values.length - nonNullValues.length,
    uniqueCount: uniqueValues.size,
  };

  // Check if numeric
  const isNumeric =
    columnType.toLowerCase().includes('int') ||
    columnType.toLowerCase().includes('float') ||
    columnType.toLowerCase().includes('double') ||
    columnType.toLowerCase().includes('decimal') ||
    columnType.toLowerCase().includes('numeric') ||
    columnType.toLowerCase().includes('real');

  if (isNumeric && nonNullValues.length > 0) {
    const numericValues = nonNullValues
      .map((v) => Number(v))
      .filter((n) => !Number.isNaN(n));
    if (numericValues.length > 0) {
      stats.sum = numericValues.reduce((a, b) => a + b, 0);
      stats.avg = stats.sum / numericValues.length;
      stats.min = Math.min(...numericValues);
      stats.max = Math.max(...numericValues);
    }
  } else if (nonNullValues.length > 0) {
    const stringValues = nonNullValues.map((v) => String(v)).sort();
    stats.min = stringValues[0];
    stats.max = stringValues[stringValues.length - 1];
  }

  return stats;
}

function TruncatedCell({
  value,
  maxLines = 2,
  wordWrap,
}: {
  value: string;
  maxLines?: number;
  wordWrap: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isTruncated =
    !wordWrap && (value.split('\n').length > maxLines || value.length > 100);

  if (wordWrap) {
    return (
      <div className="wrap-anywhere whitespace-pre-wrap text-sm">{value}</div>
    );
  }

  if (!isTruncated) {
    return <div className="line-clamp-2 text-sm">{value}</div>;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="line-clamp-2 cursor-pointer text-sm hover:underline hover:underline-offset-2">
          {value}
        </div>
      </PopoverTrigger>
      <PopoverContent className="max-h-96 w-96 overflow-y-auto">
        <div className="space-y-2">
          <p className="font-semibold text-foreground text-sm">Full Content</p>
          <div className="wrap-anywhere whitespace-pre-wrap rounded border border-border bg-muted/30 p-3 font-mono text-sm">
            {value}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => {
              navigator.clipboard.writeText(value);
            }}
          >
            <Copy className="mr-2 h-3 w-3" />
            Copy to clipboard
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Column stats popover
function ColumnStatsPopover({
  stats,
  columnName,
}: {
  stats: ColumnStats;
  columnName: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
        >
          <Hash className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3">
        <div className="space-y-2">
          <span className="font-medium text-sm">Stats: {columnName}</span>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Count:</span>
              <span className="font-mono">{stats.count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Null:</span>
              <span className="font-mono">{stats.nullCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Unique:</span>
              <span className="font-mono">{stats.uniqueCount}</span>
            </div>
            {stats.sum !== undefined && (
              <>
                <div className="my-1 border-t" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sum:</span>
                  <span className="font-mono">
                    {stats.sum.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg:</span>
                  <span className="font-mono">{stats.avg?.toFixed(2)}</span>
                </div>
              </>
            )}
            {stats.min !== undefined && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Min:</span>
                  <span className="max-w-32 truncate font-mono">
                    {String(stats.min)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max:</span>
                  <span className="max-w-32 truncate font-mono">
                    {String(stats.max)}
                  </span>
                </div>
              </>
            )}
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
  transformations = [],
  filters = [],
}: AdvancedTableViewerProps) {
  // View state
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(columns.map((c) => c.name))
  );
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [densityMode, setDensityMode] = useState<DensityMode>('default');

  // Display options
  const [showRowNumbers, setShowRowNumbers] = useState(true);
  const [zebraStriping, setZebraStriping] = useState(true);
  const [wordWrap, setWordWrap] = useState(false);
  const [showNullDistinct, setShowNullDistinct] = useState(true);
  const [pinnedColumns, setPinnedColumns] = useState<Set<string>>(new Set());
  const [fullWidth, setFullWidth] = useState(false);

  // Sorting & Global Search
  const [sortConfig, setSortConfig] = useState<{
    column: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [globalSearch, setGlobalSearch] = useState('');

  // Copy feedback
  const [copiedCell, setCopiedCell] = useState<string | null>(null);

  // Density styles
  const densityStyles = {
    compact: { py: 'py-1', text: 'text-xs' },
    default: { py: 'py-2', text: 'text-sm' },
    comfortable: { py: 'py-3', text: 'text-sm' },
  };

  const visibleColumnsArray = useMemo(() => {
    const visible = columns.filter((c) => visibleColumns.has(c.name));
    // Sort pinned columns first
    return [...visible].sort((a, b) => {
      const aPinned = pinnedColumns.has(a.name);
      const bPinned = pinnedColumns.has(b.name);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return 0;
    });
  }, [columns, visibleColumns, pinnedColumns]);

  // Filter rows based on global search and column filters
  const filteredRows = useMemo(() => {
    let filtered = [...rows];

    // Global search
    if (globalSearch) {
      const searchLower = globalSearch.toLowerCase();
      filtered = filtered.filter((row) =>
        Object.values(row).some((val) =>
          String(val ?? '')
            .toLowerCase()
            .includes(searchLower)
        )
      );
    }

    // Apply saved column filters
    const enabledFilters = filters.filter((f) => f.isEnabled);
    for (const filter of enabledFilters) {
      filtered = filtered.filter((row) => {
        const value = row[filter.columnName];
        return applyFilter(value, filter);
      });
    }

    return filtered;
  }, [rows, globalSearch, filters]);

  // Sort filtered rows
  const sortedRows = useMemo(() => {
    const sorted = [...filteredRows];
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
  }, [filteredRows, sortConfig]);

  // Toggle functions
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

  const toggleAllRows = useCallback(() => {
    if (selectedRows.size === sortedRows.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(sortedRows.map((_, i) => i)));
    }
  }, [selectedRows.size, sortedRows]);

  const togglePinColumn = (columnName: string) => {
    const newPinned = new Set(pinnedColumns);
    if (newPinned.has(columnName)) {
      newPinned.delete(columnName);
    } else {
      newPinned.add(columnName);
    }
    setPinnedColumns(newPinned);
  };

  const handleSort = (columnName: string) => {
    if (sortConfig?.column === columnName) {
      if (sortConfig.direction === 'asc') {
        setSortConfig({ column: columnName, direction: 'desc' });
      } else {
        setSortConfig(null);
      }
    } else {
      setSortConfig({ column: columnName, direction: 'asc' });
    }
  };

  const formatValue = (value: unknown, columnName?: string): string => {
    // Check if there's a transformation for this column
    if (columnName) {
      const transformation = transformations.find(
        (t) => t.columnName === columnName && t.isEnabled
      );
      if (transformation) {
        return applyTransformation(
          value,
          transformation.transformationType,
          transformation.options
        );
      }
    }

    // Default formatting
    if (value === null || value === undefined) return '∅';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const isNullValue = (value: unknown): boolean => {
    return value === null || value === undefined;
  };

  const getRowKey = (row: Row, index: number): string => {
    const id = row.id ?? row._id ?? row.uuid ?? row.key;
    if (id !== undefined && id !== null) return String(id);
    return `row-${index}`;
  };

  // Copy functions
  const copyCell = useCallback((value: string, cellId: string) => {
    navigator.clipboard.writeText(value);
    setCopiedCell(cellId);
    setTimeout(() => setCopiedCell(null), 1500);
  }, []);

  const copyRow = useCallback(
    (row: Row) => {
      const rowData = visibleColumnsArray.reduce((acc, col) => {
        acc[col.name] = row[col.name];
        return acc;
      }, {} as Record<string, unknown>);
      navigator.clipboard.writeText(JSON.stringify(rowData, null, 2));
    },
    [visibleColumnsArray]
  );

  const copySelectedRows = useCallback(() => {
    const selected = Array.from(selectedRows).map((i) => sortedRows[i]);
    navigator.clipboard.writeText(JSON.stringify(selected, null, 2));
  }, [selectedRows, sortedRows]);

  // Export functions
  const exportCSV = useCallback(() => {
    const headers = visibleColumnsArray.map((c) => c.name).join(',');
    const csvRows = sortedRows.map((row) =>
      visibleColumnsArray
        .map((col) => {
          const val = row[col.name];
          if (val === null || val === undefined) return '';
          const str = String(val);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    );
    const csv = [headers, ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tableName}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [sortedRows, visibleColumnsArray, tableName]);

  const exportJSON = useCallback(() => {
    const data = sortedRows.map((row) =>
      visibleColumnsArray.reduce((acc, col) => {
        acc[col.name] = row[col.name];
        return acc;
      }, {} as Record<string, unknown>)
    );
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tableName}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [sortedRows, visibleColumnsArray, tableName]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === 'c' && selectedRows.size > 0) {
          e.preventDefault();
          copySelectedRows();
        }
        if (e.key === 'a' && e.shiftKey) {
          e.preventDefault();
          toggleAllRows();
        }
      }
      if (e.key === 'Escape') {
        setSelectedRows(new Set());
        setGlobalSearch('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRows, copySelectedRows, toggleAllRows]);

  // Active filters count (from saved filters prop)
  const activeFiltersCount = filters.filter((f) => f.isEnabled).length;

  // Grid View
  const GridView = () => (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-border',
        fullWidth && 'w-full'
      )}
    >
      <div className="max-h-[70vh] overflow-auto">
        <table className="w-full table-fixed">
          <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur">
            <tr className="border-border border-b">
              {/* Row selection checkbox */}
              <th
                className={cn(
                  'sticky left-0 z-20 w-10 bg-muted/95 px-2',
                  densityStyles[densityMode].py
                )}
              >
                <Checkbox
                  checked={
                    selectedRows.size === sortedRows.length &&
                    sortedRows.length > 0
                  }
                  onCheckedChange={toggleAllRows}
                />
              </th>

              {/* Row number header */}
              {showRowNumbers && (
                <th
                  className={cn(
                    'sticky left-10 z-20 w-12 bg-muted/95 px-2 text-center font-medium text-muted-foreground',
                    densityStyles[densityMode].py,
                    densityStyles[densityMode].text
                  )}
                >
                  #
                </th>
              )}

              {/* Expand button header */}
              <th
                className={cn(
                  'w-10 bg-muted/95 px-2',
                  densityStyles[densityMode].py
                )}
              />

              {/* Column headers */}
              {visibleColumnsArray.map((col) => {
                const hasTransformation = transformations.some(
                  (t) => t.columnName === col.name && t.isEnabled
                );
                const isPinned = pinnedColumns.has(col.name);
                const isSorted = sortConfig?.column === col.name;
                const stats = calculateColumnStats(rows, col.name, col.type);

                return (
                  <th
                    key={col.name}
                    className={cn(
                      'group relative overflow-hidden border-border border-r px-3 text-left font-semibold text-foreground last:border-r-0',
                      densityStyles[densityMode].py,
                      isPinned && 'sticky bg-muted/95'
                    )}
                    style={{ minWidth: 150, maxWidth: 300 }}
                  >
                    <div className="flex items-center gap-1">
                      {/* Main column info */}
                      <button
                        type="button"
                        className="flex flex-1 cursor-pointer flex-col text-left"
                        onClick={() => handleSort(col.name)}
                      >
                        <span
                          className={cn(
                            'flex items-center gap-1.5 truncate',
                            densityStyles[densityMode].text
                          )}
                        >
                          {col.name}
                          {hasTransformation && (
                            <span title="Has transformation">
                              <Sparkles className="h-3 w-3 text-primary" />
                            </span>
                          )}
                          {isPinned && (
                            <Pin className="h-3 w-3 text-muted-foreground" />
                          )}
                        </span>
                        <span className="font-normal text-muted-foreground text-xs">
                          {col.type}
                        </span>
                      </button>

                      {/* Sort indicator */}
                      {isSorted ? (
                        sortConfig?.direction === 'asc' ? (
                          <ArrowUp className="h-4 w-4 text-primary" />
                        ) : (
                          <ArrowDown className="h-4 w-4 text-primary" />
                        )
                      ) : (
                        <ArrowUpDown className="h-4 w-4 opacity-0 group-hover:opacity-50" />
                      )}

                      {/* Filter indicator (if column has active filter) */}
                      {filters.some(
                        (f) => f.columnName === col.name && f.isEnabled
                      ) && (
                        <span title="Has filter">
                          <Filter className="h-3 w-3 text-primary" />
                        </span>
                      )}

                      {/* Stats button */}
                      <ColumnStatsPopover stats={stats} columnName={col.name} />

                      {/* Column menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            onClick={() => handleSort(col.name)}
                          >
                            {isSorted ? (
                              sortConfig?.direction === 'asc' ? (
                                <>
                                  <ArrowDown className="mr-2 h-4 w-4" />
                                  Sort Descending
                                </>
                              ) : (
                                <>
                                  <X className="mr-2 h-4 w-4" />
                                  Clear Sort
                                </>
                              )
                            ) : (
                              <>
                                <ArrowUp className="mr-2 h-4 w-4" />
                                Sort Ascending
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => togglePinColumn(col.name)}
                          >
                            {isPinned ? (
                              <>
                                <PinOff className="mr-2 h-4 w-4" />
                                Unpin Column
                              </>
                            ) : (
                              <>
                                <Pin className="mr-2 h-4 w-4" />
                                Pin Column
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => toggleColumnVisibility(col.name)}
                          >
                            <EyeOff className="mr-2 h-4 w-4" />
                            Hide Column
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, rowIndex) => {
              const rowKey = getRowKey(row, rowIndex);
              const isSelected = selectedRows.has(rowIndex);
              const isExpanded = expandedRows.has(rowIndex);

              return (
                <>
                  <tr
                    key={rowKey}
                    className={cn(
                      'group border-border border-b transition-colors',
                      isSelected && 'bg-primary/10',
                      !isSelected &&
                        zebraStriping &&
                        rowIndex % 2 === 1 &&
                        'bg-muted/30',
                      !isSelected && 'hover:bg-muted/50'
                    )}
                  >
                    {/* Selection checkbox */}
                    <td
                      className={cn(
                        'sticky left-0 z-10 w-10 bg-inherit px-2',
                        densityStyles[densityMode].py
                      )}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleRowSelection(rowIndex)}
                      />
                    </td>

                    {/* Row number */}
                    {showRowNumbers && (
                      <td
                        className={cn(
                          'sticky left-10 z-10 w-12 bg-inherit px-2 text-center font-mono text-muted-foreground',
                          densityStyles[densityMode].py,
                          densityStyles[densityMode].text
                        )}
                      >
                        {rowIndex + 1}
                      </td>
                    )}

                    {/* Expand button */}
                    <td
                      className={cn('w-10 px-2', densityStyles[densityMode].py)}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => toggleRowExpansion(rowIndex)}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </td>

                    {/* Data cells */}
                    {visibleColumnsArray.map((col) => {
                      const cellValue = row[col.name];
                      const formattedValue = formatValue(cellValue, col.name);
                      const cellId = `${rowKey}-${col.name}`;
                      const isPinned = pinnedColumns.has(col.name);
                      const isNull = isNullValue(cellValue);

                      return (
                        <td
                          key={cellId}
                          className={cn(
                            'group/cell relative overflow-hidden border-border border-r px-3 last:border-r-0',
                            densityStyles[densityMode].py,
                            isPinned && 'sticky bg-inherit',
                            isNull && showNullDistinct && 'bg-muted/20'
                          )}
                          style={{ minWidth: 150, maxWidth: 300 }}
                          onDoubleClick={() => copyCell(formattedValue, cellId)}
                          title="Double-click to copy"
                        >
                          <div className="flex items-center gap-1">
                            <div className="flex-1">
                              {isNull && showNullDistinct ? (
                                <span
                                  className={cn(
                                    'text-muted-foreground italic',
                                    densityStyles[densityMode].text
                                  )}
                                >
                                  ∅ null
                                </span>
                              ) : (
                                <TruncatedCell
                                  value={formattedValue}
                                  maxLines={densityMode === 'compact' ? 1 : 2}
                                  wordWrap={wordWrap}
                                />
                              )}
                            </div>
                            {/* Copy indicator */}
                            {copiedCell === cellId && (
                              <Check className="h-3 w-3 text-green-500" />
                            )}
                            {/* Copy button on hover */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 opacity-0 group-hover/cell:opacity-100"
                              onClick={() => copyCell(formattedValue, cellId)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Expanded Row Detail View */}
                  {isExpanded && (
                    <tr
                      key={`expanded-${rowKey}`}
                      className="border-border border-b bg-muted/20"
                    >
                      <td
                        colSpan={
                          3 +
                          visibleColumnsArray.length +
                          (showRowNumbers ? 1 : 0)
                        }
                        className="px-4 py-4"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                              Row {rowIndex + 1} Details
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7"
                              onClick={() => copyRow(row)}
                            >
                              <Clipboard className="mr-2 h-3 w-3" />
                              Copy Row
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                            {visibleColumnsArray.map((col) => (
                              <div
                                key={`detail-${rowKey}-${col.name}`}
                                className="rounded border border-border bg-background p-3"
                              >
                                <div className="mb-1 flex items-center justify-between">
                                  <span className="font-semibold text-muted-foreground text-xs">
                                    {col.name}
                                  </span>
                                  <span className="text-muted-foreground text-xs">
                                    {col.type}
                                  </span>
                                </div>
                                <div className="wrap-anywhere whitespace-pre-wrap rounded bg-muted/30 p-2 font-mono text-sm">
                                  {formatValue(row[col.name], col.name)}
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

  // Transpose View
  const TransposeView = () => (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur">
            <tr className="border-border border-b">
              <th
                className={cn(
                  'sticky left-0 z-20 min-w-40 border-border border-r bg-muted/95 px-4 text-left font-semibold text-foreground',
                  densityStyles[densityMode].py
                )}
              >
                Field
              </th>
              {sortedRows.slice(0, 10).map((row, colIndex) => (
                <th
                  key={getRowKey(row, colIndex)}
                  className={cn(
                    'min-w-32 border-border border-r px-4 text-left font-semibold text-foreground last:border-r-0',
                    densityStyles[densityMode].py
                  )}
                >
                  Row {colIndex + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleColumnsArray.map((col, rowIdx) => (
              <tr
                key={`field-${col.name}`}
                className={cn(
                  'border-border border-b transition-colors hover:bg-muted/30',
                  zebraStriping && rowIdx % 2 === 1 && 'bg-muted/20'
                )}
              >
                <td
                  className={cn(
                    'sticky left-0 z-10 border-border border-r bg-muted/50 px-4 font-semibold text-foreground',
                    densityStyles[densityMode].py
                  )}
                >
                  <div className="flex flex-col">
                    <span className="truncate">{col.name}</span>
                    <span className="font-normal text-muted-foreground text-xs">
                      {col.type}
                    </span>
                  </div>
                </td>
                {sortedRows.slice(0, 10).map((row, rowIndex) => {
                  const cellValue = row[col.name];
                  const isNull = isNullValue(cellValue);

                  return (
                    <td
                      key={`transpose-${col.name}-${getRowKey(row, rowIndex)}`}
                      className={cn(
                        'wrap-anywhere max-w-xs border-border border-r px-4 last:border-r-0',
                        densityStyles[densityMode].py,
                        isNull && showNullDistinct && 'bg-muted/20'
                      )}
                    >
                      {isNull && showNullDistinct ? (
                        <span className="text-muted-foreground text-sm italic">
                          ∅ null
                        </span>
                      ) : (
                        <TruncatedCell
                          value={formatValue(cellValue, col.name)}
                          maxLines={2}
                          wordWrap={wordWrap}
                        />
                      )}
                    </td>
                  );
                })}
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
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-foreground text-xl">
              {tableName}
            </h2>
            <p className="text-muted-foreground text-sm">
              {filteredRows.length !== rows.length && (
                <span className="text-primary">
                  {sortedRows.length} filtered of{' '}
                </span>
              )}
              {rows.length} rows • {visibleColumnsArray.length} of{' '}
              {columns.length} columns
              {selectedRows.size > 0 && (
                <span className="ml-2 text-primary">
                  • {selectedRows.size} selected
                </span>
              )}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            {/* Global Search */}
            <div className="relative">
              <Search className="-translate-y-1/2 absolute top-1/2 left-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search all columns..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="h-9 w-64 bg-transparent pl-9"
              />
              {globalSearch && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="-translate-y-1/2 absolute top-1/2 right-1 h-6 w-6 p-0"
                  onClick={() => setGlobalSearch('')}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Export */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-transparent"
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportCSV}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportJSON}>
                  <FileJson className="mr-2 h-4 w-4" />
                  Export as JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Controls Row */}
        <div className="flex flex-wrap items-center gap-2">
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
                <span className="rounded-full bg-muted px-1.5 text-xs">
                  {visibleColumnsArray.length}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="max-h-80 w-56 overflow-y-auto"
            >
              <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  setVisibleColumns(new Set(columns.map((c) => c.name)))
                }
              >
                Show All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setVisibleColumns(new Set())}>
                Hide All
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {columns.map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.name}
                  checked={visibleColumns.has(col.name)}
                  onCheckedChange={() => toggleColumnVisibility(col.name)}
                >
                  <span className="flex items-center gap-2">
                    {col.name}
                    {pinnedColumns.has(col.name) && (
                      <Pin className="h-3 w-3 text-muted-foreground" />
                    )}
                  </span>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Active Filters Indicator (read-only, filters managed in sidebar) */}
          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-2 rounded-md border border-primary/50 bg-primary/10 px-3 py-1.5 text-primary text-sm">
              <Filter className="h-4 w-4" />
              {activeFiltersCount} filter(s) active
            </div>
          )}

          {/* Divider */}
          <div className="mx-1 h-6 w-px bg-border" />

          {/* View Mode */}
          <div className="flex items-center rounded-md border border-border p-0.5">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 gap-1.5 px-2"
              onClick={() => setViewMode('grid')}
            >
              <Grid3x3 className="h-4 w-4" />
              Grid
            </Button>
            <Button
              variant={viewMode === 'transpose' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 gap-1.5 px-2"
              onClick={() => setViewMode('transpose')}
            >
              <Rows className="h-4 w-4" />
              Transpose
            </Button>
          </div>

          {/* Density */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 bg-transparent"
              >
                <AlignJustify className="h-4 w-4" />
                Density
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuCheckboxItem
                checked={densityMode === 'compact'}
                onCheckedChange={() => setDensityMode('compact')}
              >
                Compact
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={densityMode === 'default'}
                onCheckedChange={() => setDensityMode('default')}
              >
                Default
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={densityMode === 'comfortable'}
                onCheckedChange={() => setDensityMode('comfortable')}
              >
                Comfortable
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Display Options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 bg-transparent"
              >
                <Settings2 className="h-4 w-4" />
                Options
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Display Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={showRowNumbers}
                onCheckedChange={(checked) => setShowRowNumbers(checked)}
              >
                <Hash className="mr-2 h-4 w-4" />
                Row Numbers
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={zebraStriping}
                onCheckedChange={(checked) => setZebraStriping(checked)}
              >
                <Rows className="mr-2 h-4 w-4" />
                Zebra Striping
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={wordWrap}
                onCheckedChange={(checked) => setWordWrap(checked)}
              >
                <AlignJustify className="mr-2 h-4 w-4" />
                Word Wrap
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={showNullDistinct}
                onCheckedChange={(checked) => setShowNullDistinct(checked)}
              >
                <Eye className="mr-2 h-4 w-4" />
                Highlight Nulls
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={fullWidth}
                onCheckedChange={(checked) => setFullWidth(checked)}
              >
                {fullWidth ? (
                  <Minimize2 className="mr-2 h-4 w-4" />
                ) : (
                  <Maximize2 className="mr-2 h-4 w-4" />
                )}
                Full Width
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Selected rows actions */}
          {selectedRows.size > 0 && (
            <>
              <div className="mx-1 h-6 w-px bg-border" />
              <Button
                variant="outline"
                size="sm"
                className="gap-2 bg-transparent"
                onClick={copySelectedRows}
              >
                <Copy className="h-4 w-4" />
                Copy {selectedRows.size} row(s)
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={() => setSelectedRows(new Set())}
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Table */}
      {viewMode === 'grid' ? <GridView /> : <TransposeView />}

      {/* Footer */}
      <div className="flex items-center justify-between text-muted-foreground text-xs">
        <div className="flex items-center gap-4">
          <span>
            Showing {Math.min(100, sortedRows.length)} of {sortedRows.length}{' '}
            rows
          </span>
          {sortConfig && (
            <span className="flex items-center gap-1">
              Sorted by <strong>{sortConfig.column}</strong>
              {sortConfig.direction === 'asc' ? (
                <ArrowUp className="h-3 w-3" />
              ) : (
                <ArrowDown className="h-3 w-3" />
              )}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-muted-foreground/70">
          <span>Double-click cell to copy</span>
          <span>•</span>
          <span>Ctrl+C to copy selected</span>
          <span>•</span>
          <span>Esc to clear</span>
        </div>
      </div>
    </div>
  );
}
