'use client';

import { ArrowLeft, Code, Eye, Table } from 'lucide-react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { api } from '~/trpc/react';

export default function DatabaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const dbname = params?.dbname as string;
  const utils = api.useUtils();

  // Decode the connection ID from the dbname param
  const connectionId = Number.parseInt(dbname.split('-').pop() || '0', 10);

  // Fetch connections to get the full name
  const { data: connections = [] } = api.database.listConnections.useQuery();
  const currentConnection = connections.find((c) => c.id === connectionId);

  const handleBack = () => {
    void utils.database.listConnections.invalidate();
    router.push('/home');
  };

  // Determine active tab from pathname
  const getActiveTab = () => {
    if (pathname.includes('/query')) return 'query';
    if (pathname.includes('/info')) return 'info';
    if (pathname.includes('/tables')) return 'tables';
    // Default to tables for base [dbname] route
    return 'tables';
  };

  const activeTab = getActiveTab();

  const handleTabChange = (tab: string) => {
    if (tab === 'tables') {
      router.push(`/home/${dbname}/tables`);
    } else if (tab === 'query') {
      router.push(`/home/${dbname}/query`);
    } else if (tab === 'info') {
      router.push(`/home/${dbname}/info`);
    }
  };

  // Check if we're on a table detail page (not showing tabs)
  const isTableDetailPage =
    pathname.match(/\/home\/[^/]+\/[^/]+$/) &&
    !pathname.includes('/tables') &&
    !pathname.includes('/query') &&
    !pathname.includes('/info');

  // Check if we're on the query editor page (/query/new)
  const isQueryEditorPage = pathname.includes('/query/new');

  // Don't show the database layout header for table detail pages or query editor
  if (isTableDetailPage || isQueryEditorPage) {
    return <>{children}</>;
  }

  return (
    <>
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
                Database Inspector
              </h1>
              <p className="text-muted-foreground text-sm">
                Connection: {currentConnection?.name || `ID: ${connectionId}`}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 px-6 pb-4">
          <button
            type="button"
            onClick={() => handleTabChange('tables')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'tables'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Table className="h-4 w-4" />
            Tables
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('query')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'query'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Code className="h-4 w-4" />
            Query
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('info')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'info'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Eye className="h-4 w-4" />
            Info
          </button>
        </div>
      </div>

      <div className="p-6">{children}</div>
    </>
  );
}
