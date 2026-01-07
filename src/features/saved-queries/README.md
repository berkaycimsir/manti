# Saved Queries Feature

SQL query management and execution for Manti.

## Overview

This feature handles creating, editing, saving, and executing SQL queries against database connections. Includes a query editor, saved query management, and a Kanban-style board for organizing queries.

## Components

- **QueryEditor** - SQL editor with syntax highlighting and execution
- **QueryCard** - Card display for a saved query
- **QueryList** - List of saved queries
- **QueryTabsManager** - Multi-tab query editing interface
- **KanbanBoard** - Kanban-style organization for queries
- **SqlPreview** - SQL syntax-highlighted preview

## Hooks

- **useSavedQueries** - Hook for managing saved queries (CRUD)
- **useQueryTabs** - Hook for managing open query tabs

## Stores

- **useQueryViewStore** - View mode for query list (list/kanban)

## Types

- **SavedQuery** - Core saved query type
- **QueryTab** - Open query tab state
- **QueryViewMode** - "list" | "kanban"

## Usage

```tsx
import {
  QueryEditor,
  QueryCard,
  useQueryTabs,
  useQueryViewStore,
} from "@features/saved-queries";

function QueriesPage() {
  const { viewMode } = useQueryViewStore();
  const { tabs, addTab, removeTab, activeTab } = useQueryTabs();
  
  return (
    <>
      <QueryTabsManager tabs={tabs} activeTab={activeTab} />
      <QueryEditor connectionId={connectionId} />
    </>
  );
}
```

## Exports

All components, hooks, stores, and types are exported through the feature's `index.ts`.
