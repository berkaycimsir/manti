'use client';

import {
  ArrowLeft,
  Filter,
  Loader2,
  PanelLeft,
  PanelLeftClose,
  Settings2,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { AdvancedTableViewer } from '~/components/database/advanced-table-viewer';
import { FilterSidebar } from '~/components/database/filter-sidebar';
import { TransformationSidebar } from '~/components/database/transformation-sidebar';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';
import { api } from '~/trpc/react';
import { useLayoutContext } from '../../layout';

export default function TableDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const dbname = params?.dbname as string;
  const tablename = decodeURIComponent(params?.tablename as string);
  const utils = api.useUtils();
  const { isLayoutVisible, toggleLayout } = useLayoutContext();
  const [isTransformationSidebarOpen, setIsTransformationSidebarOpen] =
    useState(false);
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);

  // Decode the connection ID from the dbname param
  // The dbname is in format: "connectionName-connectionId"
  const connectionId = Number.parseInt(dbname.split('-').pop() || '0', 10);

  // Fetch connections to get the full name
  const { data: connections = [] } = api.database.listConnections.useQuery();
  const currentConnection = connections.find((c) => c.id === connectionId);

  // Fetch table columns
  const { data: columns = [], isLoading: columnsLoading } =
    api.database.getTableColumns.useQuery({
      connectionId,
      tableName: tablename,
      schemaName: 'public',
    });

  // Fetch table data
  const {
    data: tableData,
    isLoading: dataLoading,
    error: dataError,
  } = api.database.getTableData.useQuery({
    connectionId,
    tableName: tablename,
    schemaName: 'public',
    limit: 100,
    offset: 0,
  });

  // Fetch column transformations
  const { data: transformations = [] } =
    api.database.listColumnTransformations.useQuery({
      connectionId,
      tableName: tablename,
    });

  // Fetch column filters
  const { data: filters = [] } = api.database.listColumnFilters.useQuery({
    connectionId,
    tableName: tablename,
  });

  const handleBack = () => {
    // Invalidate the listConnections query before going back
    void utils.database.listConnections.invalidate();
    router.back();
  };

  const isLoading = columnsLoading || dataLoading;

  return (
    <div className="relative h-full">
      {/* Floating toggle button - always visible */}
      {!isLayoutVisible && (
        <div className="fixed top-4 left-4 z-20 flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleLayout}
            title="Show layout"
            className="h-9 w-9 shadow-md"
          >
            <PanelLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsFilterSidebarOpen(true)}
            title="Column Filters"
            className="h-9 w-9 shadow-md"
          >
            <Filter className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsTransformationSidebarOpen(true)}
            title="Column Transformations"
            className="h-9 w-9 shadow-md"
          >
            <Settings2 className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Header - only visible when layout is shown */}
      {isLayoutVisible && (
        <div className="sticky top-0 z-10 border-border border-b bg-card">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleLayout}
                title="Hide layout"
                className="h-9 w-9"
              >
                <PanelLeftClose className="h-5 w-5 text-muted-foreground" />
              </Button>
              <button
                type="button"
                onClick={handleBack}
                className="rounded-lg p-2 transition-colors hover:bg-muted"
              >
                <ArrowLeft className="h-5 w-5 text-muted-foreground" />
              </button>
              <div>
                <h1 className="font-bold text-2xl text-foreground">
                  {tablename}
                </h1>
                <p className="text-muted-foreground text-sm">
                  Connection: {currentConnection?.name || `ID: ${connectionId}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setIsFilterSidebarOpen(true)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {filters.filter((f) => f.isEnabled).length > 0 && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-primary-foreground text-xs">
                    {filters.filter((f) => f.isEnabled).length}
                  </span>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsTransformationSidebarOpen(true)}
                className="gap-2"
              >
                <Settings2 className="h-4 w-4" />
                Transformations
                {transformations.filter((t) => t.isEnabled).length > 0 && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-primary-foreground text-xs">
                    {transformations.filter((t) => t.isEnabled).length}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className={isLayoutVisible ? 'p-6' : 'p-4 pt-16'}>
        {isLoading ? (
          <Card className="p-12 text-center">
            <div className="mb-4 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <p className="text-muted-foreground">Loading table data...</p>
          </Card>
        ) : dataError ? (
          <Card className="border-destructive/50 bg-destructive/5 p-6">
            <p className="font-medium text-destructive">
              Error loading table data
            </p>
            <p className="text-muted-foreground text-sm">
              {dataError instanceof Error
                ? dataError.message
                : 'Failed to load table data'}
            </p>
          </Card>
        ) : (
          <AdvancedTableViewer
            tableName={tablename}
            columns={columns}
            rows={tableData?.rows ?? []}
            transformations={transformations.map((t) => ({
              columnName: t.columnName,
              transformationType: t.transformationType as
                | 'date'
                | 'number'
                | 'boolean'
                | 'json'
                | 'truncate'
                | 'mask'
                | 'uppercase'
                | 'lowercase'
                | 'capitalize'
                | 'custom',
              options: (t.options as Record<string, unknown>) ?? {},
              isEnabled: t.isEnabled ?? true,
            }))}
            filters={filters.map((f) => ({
              id: f.id,
              columnName: f.columnName,
              filterType: f.filterType as
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
                | 'in_list',
              filterValue: f.filterValue,
              filterValueEnd: f.filterValueEnd,
              isEnabled: f.isEnabled,
            }))}
          />
        )}
      </div>

      {/* Filter Sidebar */}
      <FilterSidebar
        isOpen={isFilterSidebarOpen}
        onClose={() => setIsFilterSidebarOpen(false)}
        connectionId={connectionId}
        tableName={tablename}
        columns={columns}
      />

      {/* Transformation Sidebar */}
      <TransformationSidebar
        isOpen={isTransformationSidebarOpen}
        onClose={() => setIsTransformationSidebarOpen(false)}
        connectionId={connectionId}
        tableName={tablename}
        columns={columns}
      />
    </div>
  );
}
