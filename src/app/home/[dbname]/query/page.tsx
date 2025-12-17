'use client';

import {
  ChevronDown,
  ChevronRight,
  Clock,
  Code,
  Loader2,
  PanelLeft,
  Pencil,
  Play,
  Plus,
  RowsIcon,
  Trash2,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useLayoutContext } from '~/app/home/layout';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';
import { api } from '~/trpc/react';

export default function SavedQueriesPage() {
  const router = useRouter();
  const params = useParams();
  const dbname = params?.dbname as string;
  const [expandedQueries, setExpandedQueries] = useState<Set<number>>(
    new Set()
  );
  const utils = api.useUtils();
  const { isLayoutVisible, toggleLayout } = useLayoutContext();

  // Decode the connection ID from the dbname param
  const connectionId = Number.parseInt(dbname.split('-').pop() || '0', 10);

  // Fetch saved queries
  const {
    data: savedQueries = [],
    isLoading,
    error,
  } = api.database.listSavedQueries.useQuery({ connectionId });

  // Delete mutation
  const deleteMutation = api.database.deleteSavedQuery.useMutation({
    onSuccess: () => {
      void utils.database.listSavedQueries.invalidate({ connectionId });
    },
  });

  // Execute mutation
  const executeMutation = api.database.executeSavedQuery.useMutation({
    onSuccess: () => {
      void utils.database.listSavedQueries.invalidate({ connectionId });
    },
  });

  const toggleExpanded = (id: number) => {
    const newExpanded = new Set(expandedQueries);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedQueries(newExpanded);
  };

  const handleCreateNew = () => {
    router.push(`/home/${dbname}/query/new`);
  };

  const handleEdit = (id: number) => {
    router.push(`/home/${dbname}/query/new?id=${id}`);
  };

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this query?')) {
      deleteMutation.mutate({ id });
    }
  };

  const handleExecute = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    executeMutation.mutate({ id });
  };

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return '∅';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString();
  };

  if (isLoading) {
    return (
      <Card className="p-12 text-center">
        <div className="mb-4 inline-block">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
        </div>
        <p className="text-muted-foreground">Loading queries...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5 p-6">
        <p className="font-medium text-destructive">Error loading queries</p>
        <p className="text-muted-foreground text-sm">
          {error instanceof Error ? error.message : 'Failed to load queries'}
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

      {/* Header with create button */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground text-lg">Saved Queries</h3>
        <Button onClick={handleCreateNew} className="gap-2">
          <Plus className="h-4 w-4" />
          New Query
        </Button>
      </div>

      {/* Queries list */}
      {savedQueries.length === 0 ? (
        <Card className="p-12 text-center">
          <Code className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
          <h3 className="mb-2 font-semibold text-foreground text-lg">
            No saved queries
          </h3>
          <p className="mb-6 text-muted-foreground">
            Create your first SQL query to get started
          </p>
          <Button onClick={handleCreateNew} variant="outline">
            Create Query
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {savedQueries.map((query) => {
            const isExpanded = expandedQueries.has(query.id);
            const isExecuting =
              executeMutation.isPending &&
              executeMutation.variables?.id === query.id;
            const results = query.lastResult as Array<
              Record<string, unknown>
            > | null;

            return (
              <Card key={query.id} className="overflow-hidden">
                {/* Query header - clickable to expand/collapse */}
                <button
                  type="button"
                  onClick={() => toggleExpanded(query.id)}
                  className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <h4 className="font-medium text-foreground">
                        {query.name}
                      </h4>
                      <p className="line-clamp-1 font-mono text-muted-foreground text-xs">
                        {query.query}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Stats */}
                    <div className="hidden items-center gap-4 text-muted-foreground text-sm sm:flex">
                      {query.rowCount !== null && (
                        <span className="flex items-center gap-1">
                          <RowsIcon className="h-3.5 w-3.5" />
                          {query.rowCount}
                        </span>
                      )}
                      {query.executionTimeMs !== null && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {query.executionTimeMs}ms
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => handleExecute(query.id, e)}
                        disabled={isExecuting}
                        title="Run query"
                      >
                        {isExecuting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(query.id);
                        }}
                        title="Edit query"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={(e) => handleDelete(query.id, e)}
                        disabled={deleteMutation.isPending}
                        title="Delete query"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </button>

                {/* Expanded content - query results */}
                {isExpanded && (
                  <div className="border-border border-t bg-muted/30">
                    {/* Query text */}
                    <div className="border-border border-b p-4">
                      <p className="mb-1 font-medium text-muted-foreground text-xs uppercase">
                        Query
                      </p>
                      <pre className="overflow-x-auto rounded bg-muted p-3 font-mono text-foreground text-sm">
                        {query.query}
                      </pre>
                    </div>

                    {/* Execution info */}
                    {query.lastExecutedAt && (
                      <div className="flex items-center gap-6 border-border border-b px-4 py-2 text-muted-foreground text-sm">
                        <span>
                          Last run: {formatDate(query.lastExecutedAt)}
                        </span>
                        {query.rowCount !== null && (
                          <span>{query.rowCount} rows</span>
                        )}
                        {query.executionTimeMs !== null && (
                          <span>{query.executionTimeMs}ms</span>
                        )}
                      </div>
                    )}

                    {/* Results table */}
                    {results && results.length > 0 ? (
                      <div className="max-h-80 overflow-auto">
                        <table className="w-full text-sm">
                          <thead className="sticky top-0 bg-muted">
                            <tr className="border-border border-b">
                              {Object.keys(results[0] || {}).map((col) => (
                                <th
                                  key={col}
                                  className="px-4 py-2 text-left font-semibold text-foreground"
                                >
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {results.slice(0, 20).map((row, rowIndex) => (
                              <tr
                                key={`row-${query.id}-${rowIndex}`}
                                className="border-border border-b hover:bg-muted/30"
                              >
                                {Object.entries(row).map(([colKey, value]) => (
                                  <td
                                    key={`cell-${query.id}-${rowIndex}-${colKey}`}
                                    className="max-w-xs truncate px-4 py-2 font-mono text-foreground"
                                  >
                                    {formatValue(value)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {results.length > 20 && (
                          <div className="bg-muted/50 px-4 py-2 text-center text-muted-foreground text-sm">
                            Showing first 20 of {results.length} rows.{' '}
                            <button
                              type="button"
                              onClick={() => handleEdit(query.id)}
                              className="text-primary underline"
                            >
                              Open in editor
                            </button>{' '}
                            to see all results.
                          </div>
                        )}
                      </div>
                    ) : query.lastExecutedAt ? (
                      <div className="p-6 text-center text-muted-foreground">
                        No rows returned
                      </div>
                    ) : (
                      <div className="p-6 text-center text-muted-foreground">
                        Query has not been executed yet.{' '}
                        <button
                          type="button"
                          onClick={(e) => handleExecute(query.id, e)}
                          className="text-primary underline"
                        >
                          Run now
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
