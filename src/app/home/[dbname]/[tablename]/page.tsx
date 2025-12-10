'use client';

import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Sidebar from '~/components/sidebar';
import { AdvancedTableViewer } from '~/components/database/advanced-table-viewer';
import { api } from '~/trpc/react';
import { Card } from '~/components/ui/card';

export default function TableDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const dbname = params?.dbname as string;
  const tablename = decodeURIComponent(params?.tablename as string);
  const utils = api.useUtils();

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

  const handleBack = () => {
    // Invalidate the listConnections query before going back
    void utils.database.listConnections.invalidate();
    router.back();
  };

  const isLoading = columnsLoading || dataLoading;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        connections={connections}
        selectedConnection={connectionId}
        onSelectConnection={(id) => {
          if (id && id > 0) {
            const conn = connections.find((c) => c.id === id);
            if (conn) {
              router.push(
                `/home/${conn.name.toLowerCase().replace(/\s+/g, '-')}-${id}`
              );
            }
          }
        }}
        onAddConnection={() => {
          router.push('/home');
        }}
      />

      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 border-border border-b bg-card">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
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
          </div>
        </div>

        <div className="p-6">
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
            />
          )}
        </div>
      </main>
    </div>
  );
}
