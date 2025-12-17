'use client';

import {
  AlertCircle,
  ArrowLeft,
  Clock,
  Loader2,
  PanelLeft,
  PanelLeftClose,
  Play,
  RowsIcon,
  Save,
} from 'lucide-react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useLayoutContext } from '~/app/home/layout';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { api } from '~/trpc/react';

interface QueryResult {
  rows: Array<Record<string, unknown>>;
  rowCount: number;
  command?: string;
}

export default function QueryEditorPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const dbname = params?.dbname as string;
  const queryId = searchParams.get('id');
  const { isLayoutVisible, toggleLayout } = useLayoutContext();

  const [queryName, setQueryName] = useState('');
  const [queryText, setQueryText] = useState('');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  // Decode the connection ID from the dbname param
  const connectionId = Number.parseInt(dbname.split('-').pop() || '0', 10);

  // Fetch connections to get the full name
  const { data: connections = [] } = api.database.listConnections.useQuery();
  const currentConnection = connections.find((c) => c.id === connectionId);

  // Fetch existing query if editing
  const { data: existingQuery, isLoading: isLoadingQuery } =
    api.database.getSavedQuery.useQuery(
      { id: Number(queryId) },
      { enabled: !!queryId }
    );

  // Load existing query data
  useEffect(() => {
    if (existingQuery) {
      setQueryName(existingQuery.name);
      setQueryText(existingQuery.query);
      if (existingQuery.lastResult) {
        setResult({
          rows: existingQuery.lastResult as Array<Record<string, unknown>>,
          rowCount: existingQuery.rowCount ?? 0,
        });
        setExecutionTime(existingQuery.executionTimeMs ?? null);
      }
    }
  }, [existingQuery]);

  const utils = api.useUtils();

  // Execute query mutation
  const executeQueryMutation = api.database.executeQuery.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setError(null);
      setIsExecuting(false);
    },
    onError: (err) => {
      setError(err.message);
      setResult(null);
      setIsExecuting(false);
    },
  });

  // Execute and save mutation
  const executeAndSaveMutation = api.database.executeAndSaveQuery.useMutation({
    onSuccess: (data) => {
      setResult(data.result);
      setExecutionTime(data.executionTimeMs);
      setError(null);
      setIsExecuting(false);
      void utils.database.listSavedQueries.invalidate();
      // Navigate to the saved query
      router.replace(`/home/${dbname}/query/new?id=${data.id}`);
    },
    onError: (err) => {
      setError(err.message);
      setResult(null);
      setIsExecuting(false);
    },
  });

  // Update saved query mutation
  const updateQueryMutation = api.database.updateSavedQuery.useMutation({
    onSuccess: () => {
      void utils.database.listSavedQueries.invalidate();
      void utils.database.getSavedQuery.invalidate({ id: Number(queryId) });
    },
  });

  // Execute saved query mutation
  const executeSavedQueryMutation = api.database.executeSavedQuery.useMutation({
    onSuccess: (data) => {
      setResult(data.result);
      setExecutionTime(data.executionTimeMs);
      setError(null);
      setIsExecuting(false);
      void utils.database.listSavedQueries.invalidate();
    },
    onError: (err) => {
      setError(err.message);
      setResult(null);
      setIsExecuting(false);
    },
  });

  const handleExecute = () => {
    if (!queryText.trim()) return;
    setIsExecuting(true);
    setError(null);
    const startTime = Date.now();

    if (queryId) {
      // Update the query first, then execute
      updateQueryMutation.mutate(
        { id: Number(queryId), query: queryText, name: queryName },
        {
          onSuccess: () => {
            executeSavedQueryMutation.mutate({ id: Number(queryId) });
          },
        }
      );
    } else {
      // Just execute without saving
      executeQueryMutation.mutate(
        { connectionId, query: queryText },
        {
          onSuccess: () => {
            setExecutionTime(Date.now() - startTime);
          },
        }
      );
    }
  };

  const handleSaveAndExecute = () => {
    if (!queryText.trim() || !queryName.trim()) return;
    setIsExecuting(true);
    setError(null);

    if (queryId) {
      // Update existing query
      updateQueryMutation.mutate(
        { id: Number(queryId), query: queryText, name: queryName },
        {
          onSuccess: () => {
            executeSavedQueryMutation.mutate({ id: Number(queryId) });
          },
        }
      );
    } else {
      // Create new query
      executeAndSaveMutation.mutate({
        connectionId,
        name: queryName,
        query: queryText,
      });
    }
  };

  const handleBack = () => {
    router.push(`/home/${dbname}/query`);
  };

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return '∅';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  if (isLoadingQuery && queryId) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative h-full">
      {/* Floating toggle button - always visible when layout is hidden */}
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
            size="sm"
            onClick={handleBack}
            className="shadow-md"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      )}

      {/* Floating action buttons when layout is hidden */}
      {!isLayoutVisible && (
        <div className="fixed top-4 right-4 z-20 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExecute}
            disabled={isExecuting || !queryText.trim()}
            className="shadow-md"
          >
            {isExecuting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Run
          </Button>
          <Button
            size="sm"
            onClick={handleSaveAndExecute}
            disabled={isExecuting || !queryText.trim() || !queryName.trim()}
            className="shadow-md"
          >
            {isExecuting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save & Run
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
                  {queryId ? 'Edit Query' : 'New Query'}
                </h1>
                <p className="text-muted-foreground text-sm">
                  Connection: {currentConnection?.name || `ID: ${connectionId}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleExecute}
                disabled={isExecuting || !queryText.trim()}
              >
                {isExecuting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                Run
              </Button>
              <Button
                onClick={handleSaveAndExecute}
                disabled={isExecuting || !queryText.trim() || !queryName.trim()}
              >
                {isExecuting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save & Run
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Editor content */}
      <div
        className={`flex flex-col gap-4 ${
          isLayoutVisible ? 'p-6' : 'p-4 pt-16'
        }`}
      >
        <div className="shrink-0">
          <div className="mb-4">
            <Input
              value={queryName}
              onChange={(e) => setQueryName(e.target.value)}
              placeholder="Query name..."
              className="max-w-md"
            />
          </div>
          <textarea
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            className="h-48 w-full resize-none rounded-lg border border-border bg-muted p-4 font-mono text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="SELECT * FROM table_name LIMIT 10;"
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                handleExecute();
              }
            }}
          />
          <p className="mt-2 text-muted-foreground text-xs">
            Press Cmd/Ctrl + Enter to execute
          </p>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-hidden">
          {error && (
            <Card className="border-destructive/50 bg-destructive/5 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
                <div>
                  <p className="font-medium text-destructive">
                    Query execution failed
                  </p>
                  <p className="mt-1 text-muted-foreground text-sm">{error}</p>
                </div>
              </div>
            </Card>
          )}

          {result && (
            <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border">
              {/* Result stats */}
              <div className="flex items-center gap-4 border-border border-b bg-muted/50 px-4 py-2">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <RowsIcon className="h-4 w-4" />
                  <span>{result.rowCount} rows</span>
                </div>
                {executionTime !== null && (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Clock className="h-4 w-4" />
                    <span>{executionTime}ms</span>
                  </div>
                )}
              </div>

              {/* Result table */}
              <div className="flex-1 overflow-auto">
                {result.rows.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted">
                      <tr className="border-border border-b">
                        {Object.keys(result.rows[0] || {}).map((col) => (
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
                      {result.rows.map((row) => {
                        const rowKey = JSON.stringify(row);
                        return (
                          <tr
                            key={rowKey}
                            className="border-border border-b hover:bg-muted/30"
                          >
                            {Object.entries(row).map(([colKey, value]) => (
                              <td
                                key={`${rowKey}-${colKey}`}
                                className="max-w-xs truncate px-4 py-2 font-mono text-foreground"
                              >
                                {formatValue(value)}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    {result.command === 'SELECT'
                      ? 'No rows returned'
                      : `Query executed successfully. ${result.rowCount} rows affected.`}
                  </div>
                )}
              </div>
            </div>
          )}

          {!result && !error && (
            <Card className="flex h-full items-center justify-center text-muted-foreground">
              Run a query to see results
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
