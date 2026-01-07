# Connections Feature

Database connection management for Manti.

## Overview

This feature handles creating, editing, deleting, and connecting to PostgreSQL database connections.

## Components

- **ConnectionCard** - Card display for a database connection (grid view)
- **ConnectionRow** - Row display for a database connection (list view)
- **ConnectionsHeader** - Header with search, sort, and view mode controls
- **ConnectionModal** - Modal for creating/editing connections
- **ConnectionList** - List container for connections
- **ConnectionSettingsSidebar** - Connection-specific settings panel
- **AddConnectionForm** - Form for adding new database connections

## Stores

- **useHomeViewStore** - Persists home page view mode (grid/list) and sort options

## Types

- **Connection** - Core connection type with all fields
- **ConnectionStatus** - Connection health status
- **ViewMode** - "grid" | "list"
- **SortOption** - Sorting options for connection list

## Usage

```tsx
import {
  ConnectionCard,
  ConnectionRow,
  ConnectionModal,
  useHomeViewStore,
  type Connection,
} from "@features/connections";

// Display connections
function ConnectionsPage() {
  const { viewMode } = useHomeViewStore();
  
  return (
    <>
      {viewMode === "grid" ? (
        <ConnectionCard connection={conn} />
      ) : (
        <ConnectionRow connection={conn} />
      )}
    </>
  );
}
```

## Exports

```typescript
export * from "./types";
export * from "./stores/home-view-store";
export { ConnectionCard } from "./components/connection-card";
export { ConnectionRow } from "./components/connection-row";
export { ConnectionsHeader } from "./components/connections-header";
export { default as ConnectionModal } from "./components/connection-modal";
export { AddConnectionForm } from "./components/connection-form";
export { ConnectionList } from "./components/connection-list";
export { ConnectionSettingsSidebar } from "./components/connection-settings-sidebar";
```
