'use client';

import {
  ArrowDownNarrowWide,
  ArrowUpNarrowWide,
  CaseSensitive,
  CircleDot,
  CircleOff,
  Equal,
  EqualNot,
  Filter,
  List,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { Input } from '~/components/ui/input';
import { cn } from '~/lib/utils';
import { api } from '~/trpc/react';

interface Column {
  name: string;
  type: string;
}

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  connectionId: number;
  tableName: string;
  columns: Column[];
}

type FilterType =
  | 'contains'
  | 'equals'
  | 'not_equals'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'between'
  | 'is_null'
  | 'is_not_null'
  | 'in_list';

interface FilterOption {
  type: FilterType;
  label: string;
  icon: React.ReactNode;
  description: string;
  needsValue: boolean;
  needsSecondValue: boolean;
}

const FILTER_OPTIONS: FilterOption[] = [
  {
    type: 'contains',
    label: 'Contains',
    icon: <CaseSensitive className="h-4 w-4" />,
    description: 'Text contains value',
    needsValue: true,
    needsSecondValue: false,
  },
  {
    type: 'equals',
    label: 'Equals',
    icon: <Equal className="h-4 w-4" />,
    description: 'Exact match',
    needsValue: true,
    needsSecondValue: false,
  },
  {
    type: 'not_equals',
    label: 'Not Equals',
    icon: <EqualNot className="h-4 w-4" />,
    description: 'Does not match',
    needsValue: true,
    needsSecondValue: false,
  },
  {
    type: 'starts_with',
    label: 'Starts With',
    icon: <ArrowDownNarrowWide className="h-4 w-4" />,
    description: 'Text starts with value',
    needsValue: true,
    needsSecondValue: false,
  },
  {
    type: 'ends_with',
    label: 'Ends With',
    icon: <ArrowUpNarrowWide className="h-4 w-4" />,
    description: 'Text ends with value',
    needsValue: true,
    needsSecondValue: false,
  },
  {
    type: 'greater_than',
    label: 'Greater Than',
    icon: <ArrowUpNarrowWide className="h-4 w-4" />,
    description: 'Value is greater than',
    needsValue: true,
    needsSecondValue: false,
  },
  {
    type: 'less_than',
    label: 'Less Than',
    icon: <ArrowDownNarrowWide className="h-4 w-4" />,
    description: 'Value is less than',
    needsValue: true,
    needsSecondValue: false,
  },
  {
    type: 'between',
    label: 'Between',
    icon: <ArrowDownNarrowWide className="h-4 w-4" />,
    description: 'Value is between two values',
    needsValue: true,
    needsSecondValue: true,
  },
  {
    type: 'is_null',
    label: 'Is Null',
    icon: <CircleOff className="h-4 w-4" />,
    description: 'Value is null/empty',
    needsValue: false,
    needsSecondValue: false,
  },
  {
    type: 'is_not_null',
    label: 'Is Not Null',
    icon: <CircleDot className="h-4 w-4" />,
    description: 'Value is not null',
    needsValue: false,
    needsSecondValue: false,
  },
  {
    type: 'in_list',
    label: 'In List',
    icon: <List className="h-4 w-4" />,
    description: 'Value is in comma-separated list',
    needsValue: true,
    needsSecondValue: false,
  },
];

function getFilterOption(type: FilterType): FilterOption | undefined {
  return FILTER_OPTIONS.find((opt) => opt.type === type);
}

function getFilterIcon(type: string) {
  const option = FILTER_OPTIONS.find((opt) => opt.type === type);
  return option?.icon ?? <Filter className="h-4 w-4" />;
}

function getFilterLabel(type: string) {
  const option = FILTER_OPTIONS.find((opt) => opt.type === type);
  return option?.label ?? type;
}

export function FilterSidebar({
  isOpen,
  onClose,
  connectionId,
  tableName,
  columns,
}: FilterSidebarProps) {
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [selectedFilterType, setSelectedFilterType] =
    useState<FilterType | null>(null);
  const [filterValue, setFilterValue] = useState('');
  const [filterValueEnd, setFilterValueEnd] = useState('');

  const utils = api.useUtils();

  // Fetch existing filters
  const { data: filters = [], isLoading } =
    api.database.listColumnFilters.useQuery({
      connectionId,
      tableName,
    });

  // Create filter mutation
  const createFilter = api.database.createColumnFilter.useMutation({
    onSuccess: () => {
      utils.database.listColumnFilters.invalidate({ connectionId, tableName });
      resetForm();
    },
  });

  // Update filter mutation
  const updateFilter = api.database.updateColumnFilter.useMutation({
    onSuccess: () => {
      utils.database.listColumnFilters.invalidate({ connectionId, tableName });
    },
  });

  // Delete filter mutation
  const deleteFilter = api.database.deleteColumnFilter.useMutation({
    onSuccess: () => {
      utils.database.listColumnFilters.invalidate({ connectionId, tableName });
    },
  });

  const resetForm = () => {
    setSelectedColumn(null);
    setSelectedFilterType(null);
    setFilterValue('');
    setFilterValueEnd('');
  };

  const handleCreateFilter = () => {
    if (!selectedColumn || !selectedFilterType) return;

    const filterOption = getFilterOption(selectedFilterType);
    if (!filterOption) return;

    // Validate required values
    if (filterOption.needsValue && !filterValue.trim()) return;
    if (filterOption.needsSecondValue && !filterValueEnd.trim()) return;

    createFilter.mutate({
      connectionId,
      tableName,
      columnName: selectedColumn,
      filterType: selectedFilterType,
      filterValue: filterOption.needsValue ? filterValue : null,
      filterValueEnd: filterOption.needsSecondValue ? filterValueEnd : null,
      isEnabled: true,
    });
  };

  const handleToggleEnabled = (id: number, currentlyEnabled: boolean) => {
    updateFilter.mutate({
      id,
      isEnabled: !currentlyEnabled,
    });
  };

  const handleDelete = (id: number) => {
    deleteFilter.mutate({ id });
  };

  // Get columns that don't have filters yet
  const columnsWithoutFilters = columns.filter(
    (col) => !filters.some((f) => f.columnName === col.name)
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        role="button"
        tabIndex={0}
        aria-label="Close sidebar"
      />

      {/* Sidebar */}
      <div className="fixed top-0 right-0 z-50 flex h-full w-[480px] flex-col border-border border-l bg-background shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-border border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-foreground text-lg">
              Column Filters
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Existing filters */}
              {filters.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium text-foreground text-sm">
                    Active Filters ({filters.filter((f) => f.isEnabled).length})
                  </h3>
                  {filters.map((filter) => (
                    <Card
                      key={filter.id}
                      className={cn('p-3', !filter.isEnabled && 'opacity-50')}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getFilterIcon(filter.filterType)}
                          <div>
                            <p className="font-medium text-foreground text-sm">
                              {filter.columnName}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {getFilterLabel(filter.filterType)}
                              {filter.filterValue && (
                                <span className="ml-1 font-mono">
                                  : "{filter.filterValue}"
                                </span>
                              )}
                              {filter.filterValueEnd && (
                                <span className="ml-1 font-mono">
                                  to "{filter.filterValueEnd}"
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className={cn(
                              'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors',
                              filter.isEnabled ? 'bg-primary' : 'bg-muted'
                            )}
                            onClick={() =>
                              handleToggleEnabled(
                                filter.id,
                                filter.isEnabled ?? true
                              )
                            }
                          >
                            <span
                              className={cn(
                                'inline-block h-4 w-4 rounded-full bg-background shadow-sm transition-transform',
                                filter.isEnabled
                                  ? 'translate-x-6'
                                  : 'translate-x-1'
                              )}
                            />
                          </button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(filter.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Add new filter */}
              <div className="space-y-3">
                <h3 className="font-medium text-foreground text-sm">
                  Add Filter
                </h3>

                {selectedColumn ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-foreground text-sm">
                        {selectedColumn}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedColumn(null);
                          setSelectedFilterType(null);
                          setFilterValue('');
                          setFilterValueEnd('');
                        }}
                      >
                        <X className="mr-1 h-3 w-3" />
                        Cancel
                      </Button>
                    </div>

                    {selectedFilterType ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 rounded-md bg-muted/50 p-2">
                          {getFilterIcon(selectedFilterType)}
                          <span className="text-sm">
                            {getFilterLabel(selectedFilterType)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-auto h-6 px-2"
                            onClick={() => {
                              setSelectedFilterType(null);
                              setFilterValue('');
                              setFilterValueEnd('');
                            }}
                          >
                            Change
                          </Button>
                        </div>

                        {/* Filter value inputs */}
                        {getFilterOption(selectedFilterType)?.needsValue && (
                          <Input
                            placeholder={
                              selectedFilterType === 'in_list'
                                ? 'value1, value2, value3'
                                : 'Enter filter value...'
                            }
                            value={filterValue}
                            onChange={(e) => setFilterValue(e.target.value)}
                          />
                        )}

                        {getFilterOption(selectedFilterType)
                          ?.needsSecondValue && (
                          <Input
                            placeholder="Enter end value..."
                            value={filterValueEnd}
                            onChange={(e) => setFilterValueEnd(e.target.value)}
                          />
                        )}

                        <Button
                          className="w-full"
                          onClick={handleCreateFilter}
                          disabled={createFilter.isPending}
                        >
                          {createFilter.isPending ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            <>
                              <Plus className="mr-2 h-4 w-4" />
                              Add Filter
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {FILTER_OPTIONS.map((option) => (
                          <Button
                            key={option.type}
                            variant="outline"
                            className="h-auto flex-col items-start justify-start gap-1 p-3"
                            onClick={() => setSelectedFilterType(option.type)}
                          >
                            <div className="flex items-center gap-2">
                              {option.icon}
                              <span className="font-medium text-sm">
                                {option.label}
                              </span>
                            </div>
                            <span className="text-left text-muted-foreground text-xs">
                              {option.description}
                            </span>
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : columns.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No columns available
                  </p>
                ) : (
                  <div className="space-y-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full">
                          <Plus className="mr-2 h-4 w-4" />
                          Select Column
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="max-h-64 w-64 overflow-y-auto">
                        {columns.map((col) => {
                          const hasFilter = filters.some(
                            (f) => f.columnName === col.name
                          );
                          return (
                            <DropdownMenuItem
                              key={col.name}
                              onClick={() => setSelectedColumn(col.name)}
                              disabled={hasFilter}
                            >
                              <div className="flex flex-col">
                                <span className={hasFilter ? 'opacity-50' : ''}>
                                  {col.name}
                                </span>
                                <span className="text-muted-foreground text-xs">
                                  {col.type}
                                  {hasFilter && ' (has filter)'}
                                </span>
                              </div>
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>

              {/* Quick tips */}
              {filters.length === 0 && !selectedColumn && (
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <h4 className="mb-2 font-medium text-foreground text-sm">
                    Filter Tips
                  </h4>
                  <ul className="space-y-1 text-muted-foreground text-xs">
                    <li>• Filters are saved and persist across sessions</li>
                    <li>• Multiple filters are combined with AND logic</li>
                    <li>• Toggle filters on/off without deleting them</li>
                    <li>• Use "In List" for comma-separated values</li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-border border-t p-4">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>
              {filters.filter((f) => f.isEnabled).length} active filter(s)
            </span>
            {filters.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  // Disable all filters
                  for (const f of filters) {
                    if (f.isEnabled) {
                      updateFilter.mutate({ id: f.id, isEnabled: false });
                    }
                  }
                }}
              >
                Disable All
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Export filter configuration type for use in table viewer
export interface FilterConfig {
  id: number;
  columnName: string;
  filterType: FilterType;
  filterValue: string | null;
  filterValueEnd: string | null;
  isEnabled: boolean | null;
}

// Apply filter to a value
export function applyFilter(value: unknown, filter: FilterConfig): boolean {
  if (!filter.isEnabled) return true;

  const strValue = value === null || value === undefined ? '' : String(value);
  const filterVal = filter.filterValue ?? '';

  switch (filter.filterType) {
    case 'contains':
      return strValue.toLowerCase().includes(filterVal.toLowerCase());
    case 'equals':
      return strValue.toLowerCase() === filterVal.toLowerCase();
    case 'not_equals':
      return strValue.toLowerCase() !== filterVal.toLowerCase();
    case 'starts_with':
      return strValue.toLowerCase().startsWith(filterVal.toLowerCase());
    case 'ends_with':
      return strValue.toLowerCase().endsWith(filterVal.toLowerCase());
    case 'greater_than': {
      const numValue = Number(value);
      const numFilter = Number(filterVal);
      if (Number.isNaN(numValue) || Number.isNaN(numFilter)) {
        return strValue > filterVal;
      }
      return numValue > numFilter;
    }
    case 'less_than': {
      const numValue = Number(value);
      const numFilter = Number(filterVal);
      if (Number.isNaN(numValue) || Number.isNaN(numFilter)) {
        return strValue < filterVal;
      }
      return numValue < numFilter;
    }
    case 'between': {
      const numValue = Number(value);
      const numStart = Number(filterVal);
      const numEnd = Number(filter.filterValueEnd);
      if (
        Number.isNaN(numValue) ||
        Number.isNaN(numStart) ||
        Number.isNaN(numEnd)
      ) {
        return (
          strValue >= filterVal && strValue <= (filter.filterValueEnd ?? '')
        );
      }
      return numValue >= numStart && numValue <= numEnd;
    }
    case 'is_null':
      return value === null || value === undefined || strValue === '';
    case 'is_not_null':
      return value !== null && value !== undefined && strValue !== '';
    case 'in_list': {
      const listValues = filterVal
        .split(',')
        .map((v) => v.trim().toLowerCase());
      return listValues.includes(strValue.toLowerCase());
    }
    default:
      return true;
  }
}
