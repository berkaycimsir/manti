'use client';

import { Filter, Settings2 } from 'lucide-react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState, useRef } from 'react';
import {
  AdvancedTableViewer,
  type AdvancedTableViewerRef,
} from '~/components/database/advanced-table-viewer';
import { TableToolbar } from '~/components/database/table/table-header';
import { FilterSidebar } from '~/components/database/filter-sidebar';
import { TransformationSidebar } from '~/components/database/transformation-sidebar';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';
import { TableDataSkeleton } from '~/components/ui/content-skeletons';
import { useHeader } from '~/hooks/use-header';
import { TableStructure } from '~/components/database/tables/table-structure';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { api } from '~/trpc/react';

export default function TableDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const dbname = params?.dbname as string;
  const tablename = decodeURIComponent(params?.tablename as string);
  const searchParams = useSearchParams();
  const schemaName = searchParams.get('schema') || 'public';
  const utils = api.useUtils();
  const [isTransformationSidebarOpen, setIsTransformationSidebarOpen] =
    useState(false);
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);

  // Decode the connection ID from the dbname param
  const connectionId = Number.parseInt(dbname.split('-').pop() || '0', 10);

  // Fetch connections to get the full name
  const { data: connections = [] } = api.database.listConnections.useQuery();
  const currentConnection = connections.find((c) => c.id === connectionId);

  // Fetch table columns
  const { data: columns = [], isLoading: columnsLoading } =
    api.database.getTableColumns.useQuery({
      connectionId,
      tableName: tablename,
      schemaName,
    });

  // Fetch table data
  const {
    data: tableData,
    isLoading: dataLoading,
    error: dataError,
  } = api.database.getTableData.useQuery({
    connectionId,
    tableName: tablename,
    schemaName,
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

  const handleBack = useCallback(() => {
    void utils.database.listConnections.invalidate();
    router.back();
  }, [router, utils]);

  const isLoading = columnsLoading || dataLoading;

  // Memoized action buttons for header
  const headerActions = useMemo(
    () => (
      <>
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
      </>
    ),
    [filters, transformations]
  );

  // Memoized floating actions for when layout is hidden
  const floatingActions = useMemo(
    () => (
      <>
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
      </>
    ),
    []
  );

  // Register header via hook
  useHeader({
    title: tablename,
    subtitle: `Connection: ${currentConnection?.name || `ID: ${connectionId}`}`,
    onBack: handleBack,
    actions: headerActions,
    floatingActions: floatingActions,
  });

  // State and Refs for external control
  const [searchQuery, setSearchQuery] = useState('');
  const tableRef = useRef<AdvancedTableViewerRef>(null);

  return (
    <div className="relative flex h-full flex-col">
      <Tabs defaultValue="data" className="flex flex-1 flex-col">
        <div className="flex items-center justify-between px-6 pt-4">
          <TabsList>
            <TabsTrigger value="data">Data</TabsTrigger>
            <TabsTrigger value="structure">Structure</TabsTrigger>
          </TabsList>

          <TableToolbar
            globalSearch={searchQuery}
            onSearchChange={setSearchQuery}
            onExportCSV={() => tableRef.current?.exportCSV()}
            onExportJSON={() => tableRef.current?.exportJSON()}
          />
        </div>

        <div className="min-h-0 flex-1 px-6 pt-2">
          <TabsContent value="data" className="mt-0 h-full">
            {isLoading ? (
              <TableDataSkeleton rows={8} columns={5} />
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
                ref={tableRef}
                dbName={dbname}
                tableName={tablename}
                columns={columns}
                rows={tableData?.rows ?? []}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
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
          </TabsContent>

          <TabsContent value="structure" className="mt-0 h-full overflow-auto">
            <TableStructure
              connectionId={connectionId}
              tableName={tablename}
              schema={schemaName}
            />
          </TabsContent>
        </div>
      </Tabs>

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
