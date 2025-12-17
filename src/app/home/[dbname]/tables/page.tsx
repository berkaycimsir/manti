'use client';

import { PanelLeft, Table } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useLayoutContext } from '~/app/home/layout';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';
import { api } from '~/trpc/react';

export default function TablesPage() {
  const router = useRouter();
  const params = useParams();
  const dbname = params?.dbname as string;
  const { isLayoutVisible, toggleLayout } = useLayoutContext();

  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  // Decode the connection ID from the dbname param
  const connectionId = Number.parseInt(dbname.split('-').pop() || '0', 10);

  // Fetch real tables from the database
  const {
    data: tables = [],
    isLoading: tablesLoading,
    error: tablesError,
  } = api.database.getTables.useQuery(
    { connectionId },
    { enabled: connectionId > 0 }
  );

  // Fetch columns for selected table
  const { data: columns = [], isLoading: columnsLoading } =
    api.database.getTableColumns.useQuery(
      { connectionId, tableName: selectedTable ?? '', schemaName: 'public' },
      { enabled: !!selectedTable && connectionId > 0 }
    );

  if (tablesLoading) {
    return (
      <Card className="p-12 text-center">
        <div className="mb-4 inline-block">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
        </div>
        <p className="text-muted-foreground">Loading tables...</p>
      </Card>
    );
  }

  if (tablesError) {
    return (
      <Card className="border-destructive/50 bg-destructive/5 p-6">
        <p className="font-medium text-destructive">Error loading tables</p>
        <p className="text-muted-foreground text-sm">
          {tablesError instanceof Error
            ? tablesError.message
            : 'Failed to load tables'}
        </p>
      </Card>
    );
  }

  if (tables.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Table className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">
          No tables found in this database
        </p>
      </Card>
    );
  }

  return (
    <div className="relative space-y-4">
      {/* Floating toggle button when layout is hidden */}
      {!isLayoutVisible && (
        <Button
          variant="outline"
          size="icon"
          onClick={toggleLayout}
          title="Show layout"
          className="fixed top-4 left-4 z-20 h-9 w-9 shadow-md"
        >
          <PanelLeft className="h-5 w-5" />
        </Button>
      )}

      {tables.map((table) => (
        <Card
          key={`${table.schema}.${table.name}`}
          className={`cursor-pointer p-6 transition-shadow hover:shadow-md ${
            selectedTable === table.name
              ? 'border-primary ring-1 ring-primary'
              : ''
          }`}
          onClick={() => setSelectedTable(table.name)}
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground text-lg">
                {table.name}
              </h3>
              <p className="text-muted-foreground text-sm">
                Schema: {table.schema}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                router.push(
                  `/home/${dbname}/${encodeURIComponent(table.name)}`
                );
              }}
            >
              View
            </Button>
          </div>

          {selectedTable === table.name && columnsLoading ? (
            <div className="py-4 text-center">
              <div className="mb-2 inline-block">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary" />
              </div>
              <p className="text-muted-foreground text-sm">
                Loading columns...
              </p>
            </div>
          ) : selectedTable === table.name && columns.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-border border-b">
                    <th className="px-3 py-2 text-left font-medium text-foreground">
                      Column
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-foreground">
                      Type
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-foreground">
                      Nullable
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {columns.map((column) => (
                    <tr
                      key={column.name}
                      className="border-border border-b hover:bg-muted/50"
                    >
                      <td className="px-3 py-2 font-mono text-foreground">
                        {column.name}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {column.type}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`rounded px-2 py-1 text-xs ${
                            column.nullable
                              ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
                              : 'bg-green-500/10 text-green-700 dark:text-green-400'
                          }`}
                        >
                          {column.nullable ? 'Yes' : 'No'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </Card>
      ))}
    </div>
  );
}
