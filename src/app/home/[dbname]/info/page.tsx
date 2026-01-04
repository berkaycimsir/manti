'use client';

import { useParams } from 'next/navigation';
import { Card } from '~/components/ui/card';
import { useLayoutStore } from '~/stores/layout-store';
import { api } from '~/trpc/react';

export default function InfoPage() {
  const params = useParams();
  const dbname = params?.dbname as string;
  const _isLayoutVisible = useLayoutStore((state) => state.isLayoutVisible);

  // Decode the connection ID from the dbname param
  const connectionId = Number.parseInt(dbname.split('-').pop() || '0', 10);

  // Fetch connections to get the full name
  const { data: connections = [] } = api.database.listConnections.useQuery();
  const currentConnection = connections.find((c) => c.id === connectionId);

  // Fetch real tables from the database
  const { data: tables = [] } = api.database.getTables.useQuery(
    { connectionId },
    { enabled: connectionId > 0 }
  );

  // Fetch schemas
  const { data: schemas = [] } = api.database.getSchemas.useQuery(
    { connectionId },
    { enabled: connectionId > 0 }
  );

  return (
    <div className="relative space-y-6">
      <Card className="p-6">
        <h3 className="mb-4 font-semibold text-foreground text-lg">
          Connection Information
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="mb-1 text-muted-foreground text-sm">
              Connection Name
            </p>
            <p className="font-semibold text-foreground">
              {currentConnection?.name || 'Unknown'}
            </p>
          </div>
          <div>
            <p className="mb-1 text-muted-foreground text-sm">Connection ID</p>
            <p className="font-semibold text-foreground">{connectionId}</p>
          </div>
          <div>
            <p className="mb-1 text-muted-foreground text-sm">Host</p>
            <p className="font-semibold text-foreground">
              {currentConnection?.host || 'N/A'}
            </p>
          </div>
          <div>
            <p className="mb-1 text-muted-foreground text-sm">Port</p>
            <p className="font-semibold text-foreground">
              {currentConnection?.port || 'N/A'}
            </p>
          </div>
          <div>
            <p className="mb-1 text-muted-foreground text-sm">Database</p>
            <p className="font-semibold text-foreground">
              {currentConnection?.database || 'N/A'}
            </p>
          </div>
          <div>
            <p className="mb-1 text-muted-foreground text-sm">Username</p>
            <p className="font-semibold text-foreground">
              {currentConnection?.username || 'N/A'}
            </p>
          </div>
          <div>
            <p className="mb-1 text-muted-foreground text-sm">SSL</p>
            <p className="font-semibold text-foreground">
              {currentConnection?.ssl ? 'Enabled' : 'Disabled'}
            </p>
          </div>
          <div>
            <p className="mb-1 text-muted-foreground text-sm">Status</p>
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  currentConnection?.isActive ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <p className="font-semibold text-foreground">
                {currentConnection?.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 font-semibold text-foreground text-lg">
          Database Statistics
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="mb-1 text-muted-foreground text-sm">Total Tables</p>
            <p className="font-semibold text-2xl text-foreground">
              {tables.length}
            </p>
          </div>
          <div>
            <p className="mb-1 text-muted-foreground text-sm">Total Schemas</p>
            <p className="font-semibold text-2xl text-foreground">
              {schemas.length}
            </p>
          </div>
        </div>
      </Card>

      {schemas.length > 0 && (
        <Card className="p-6">
          <h3 className="mb-4 font-semibold text-foreground text-lg">
            Schemas
          </h3>
          <div className="flex flex-wrap gap-2">
            {schemas.map((schema) => (
              <span
                key={schema}
                className="rounded-full bg-muted px-3 py-1 text-muted-foreground text-sm"
              >
                {schema}
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
