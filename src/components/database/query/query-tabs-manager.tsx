'use client';

import { LayoutGrid, List, Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { api } from '~/trpc/react';
import { CreateTabDialog } from './create-tab-dialog';
import { EditTabDialog } from './edit-tab-dialog';
import { KanbanBoard } from './kanban-board';
import { TabView } from './tab-view';
import { KanbanSkeleton } from '~/components/ui/content-skeletons';

import { useQueryViewStore } from '~/stores/query-view-store';

interface QueryTabsManagerProps {
  connectionId: number;
  onEditQuery: (id: number) => void;
  onExecuteQuery: (id: number) => void;
}

export function QueryTabsManager({
  connectionId,
  onEditQuery,
}: QueryTabsManagerProps) {
  const { viewMode, setViewMode } = useQueryViewStore();
  const [isCreateTabOpen, setIsCreateTabOpen] = useState(false);
  const [editingTab, setEditingTab] = useState<{
    id: number;
    name: string;
  } | null>(null);

  // Fetch Tabs and Queries
  const {
    data: tabs = [],
    isLoading: tabsLoading,
    refetch: refetchTabs,
  } = api.database.listTabs.useQuery({ connectionId });
  const {
    data: queries = [],
    isLoading: queriesLoading,
    refetch: refetchQueries,
  } = api.database.listSavedQueries.useQuery({ connectionId });

  const isLoading = tabsLoading || queriesLoading;

  // Mutations
  const utils = api.useUtils();

  const executeMutation = api.database.executeSavedQuery.useMutation({
    onSuccess: () =>
      utils.database.listSavedQueries.invalidate({ connectionId }),
  });

  const deleteMutation = api.database.deleteSavedQuery.useMutation({
    onSuccess: () =>
      utils.database.listSavedQueries.invalidate({ connectionId }),
  });

  // Optimistic update for tab position
  const updateTabMutation = api.database.updateTab.useMutation({
    onMutate: async (newTab) => {
      // Cancel outgoing refetches
      await utils.database.listTabs.cancel({ connectionId });

      // Snapshot previous value
      const previousTabs = utils.database.listTabs.getData({ connectionId });

      // Optimistically update
      if (previousTabs && newTab.position !== undefined) {
        utils.database.listTabs.setData({ connectionId }, (old) => {
          if (!old) return [];
          return old
            .map((t) => {
              if (t.id === newTab.id) {
                return { ...t, position: newTab.position ?? t.position };
              }
              return t;
            })
            .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
        });
      }

      return { previousTabs };
    },
    onError: (_err, _newTab, context) => {
      // Rollback on error
      if (context?.previousTabs) {
        utils.database.listTabs.setData({ connectionId }, context.previousTabs);
      }
    },
    onSettled: () => {
      // Sync with server
      utils.database.listTabs.invalidate({ connectionId });
    },
  });

  // Optimistic update for query tab changes
  const updateQueryMutation = api.database.updateSavedQuery.useMutation({
    onMutate: async (newQuery) => {
      await utils.database.listSavedQueries.cancel({ connectionId });

      const previousQueries = utils.database.listSavedQueries.getData({
        connectionId,
      });

      if (previousQueries) {
        utils.database.listSavedQueries.setData({ connectionId }, (old) => {
          if (!old) return [];
          return old.map((q) => {
            if (q.id === newQuery.id) {
              return {
                ...q,
                ...newQuery,
              } as typeof q;
            }
            return q;
          });
        });
      }

      return { previousQueries };
    },
    onError: (_err, _newQuery, context) => {
      if (context?.previousQueries) {
        utils.database.listSavedQueries.setData(
          { connectionId },
          context.previousQueries
        );
      }
    },
    onSettled: () => {
      utils.database.listSavedQueries.invalidate({ connectionId });
    },
  });

  const handleCreateTabSuccess = () => {
    setIsCreateTabOpen(false);
    void refetchTabs();
  };

  const handleEditTabSuccess = () => {
    setEditingTab(null);
    void refetchTabs();
    void refetchQueries();
  };

  const handleExecute = (id: number) => {
    executeMutation.mutate({ id });
  };

  const handleDelete = (id: number) => {
    if (confirm('Delete this query?')) {
      deleteMutation.mutate({ id });
    }
  };

  // Handle tab position change with optimistic reordering
  const handleReorderTabs = (
    reorderedTabs: Array<{ id: number; position?: number | null }>
  ) => {
    // Update ALL tabs with their new positions
    console.log('Reordering tabs:', reorderedTabs);
    reorderedTabs.forEach((tab, index) => {
      console.log(`Updating tab ${tab.id} to position ${index}`);
      updateTabMutation.mutate({ id: tab.id, position: index });
    });
  };

  if (isLoading) {
    return <KanbanSkeleton columns={3} />;
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'tabs' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('tabs')}
            className="gap-2"
          >
            <List className="h-4 w-4" /> Tabs
          </Button>
          <Button
            variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('kanban')}
            className="gap-2"
          >
            <LayoutGrid className="h-4 w-4" /> Board
          </Button>
        </div>
        <Button
          onClick={() => setIsCreateTabOpen(true)}
          size="sm"
          variant="outline"
          className="gap-2"
        >
          <Plus className="h-4 w-4" /> New Tab
        </Button>
      </div>

      {/* Main Content */}
      {viewMode === 'tabs' ? (
        <TabView
          tabs={tabs}
          queries={queries}
          onExecute={handleExecute}
          onEdit={onEditQuery}
          onDelete={handleDelete}
          isExecutingId={
            executeMutation.isPending
              ? executeMutation.variables?.id
              : undefined
          }
          isDeletingId={
            deleteMutation.isPending ? deleteMutation.variables?.id : undefined
          }
          onEditTab={(tab) => setEditingTab(tab)}
        />
      ) : (
        <KanbanBoard
          tabs={tabs}
          queries={queries}
          onMoveQuery={(id, tabId) => updateQueryMutation.mutate({ id, tabId })}
          onReorderTabs={handleReorderTabs}
          onExecute={handleExecute}
          onEdit={onEditQuery}
          onDelete={handleDelete}
          onEditTab={(tab) => setEditingTab(tab)}
          isExecutingId={
            executeMutation.isPending
              ? executeMutation.variables?.id
              : undefined
          }
          isDeletingId={
            deleteMutation.isPending ? deleteMutation.variables?.id : undefined
          }
        />
      )}

      <CreateTabDialog
        open={isCreateTabOpen}
        onOpenChange={setIsCreateTabOpen}
        connectionId={connectionId}
        onSuccess={handleCreateTabSuccess}
      />

      <EditTabDialog
        open={!!editingTab}
        onOpenChange={(open) => !open && setEditingTab(null)}
        tab={editingTab}
        connectionId={connectionId}
        onSuccess={handleEditTabSuccess}
      />
    </div>
  );
}
