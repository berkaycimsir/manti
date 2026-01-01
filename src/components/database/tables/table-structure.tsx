'use client';

import { AlertCircle } from 'lucide-react';
import { Card } from '~/components/ui/card';
import { ColumnsSkeleton } from '~/components/ui/content-skeletons';
import { api } from '~/trpc/react';

interface TableStructureProps {
  connectionId: number;
  tableName: string;
  schema: string;
}

export function TableStructure({
  connectionId,
  tableName,
  schema,
}: TableStructureProps) {
  const {
    data: columns = [],
    isLoading,
    error,
  } = api.database.getTableColumns.useQuery({
    connectionId,
    tableName,
    schemaName: schema,
  });

  if (isLoading) {
    return <ColumnsSkeleton columns={5} />;
  }

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
          <div>
            <p className="font-medium text-destructive">
              Error loading columns
            </p>
            <p className="mt-1 text-muted-foreground text-sm">
              {error.message}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (columns.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No columns found
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-border">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-border border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-foreground">
                Column
              </th>
              <th className="px-4 py-3 text-left font-medium text-foreground">
                Type
              </th>
              <th className="px-4 py-3 text-left font-medium text-foreground">
                Nullable
              </th>
              {/* Future: Add more details like default value, PK, etc. */}
            </tr>
          </thead>
          <tbody>
            {columns.map((column) => (
              <tr
                key={column.name}
                className="border-border border-b last:border-0 hover:bg-muted/50"
              >
                <td className="px-4 py-2 font-mono text-foreground">
                  {column.name}
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  {column.type}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 font-medium text-xs ${
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
    </div>
  );
}
