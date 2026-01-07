# Table Explorer Feature

Table viewing and data exploration for Manti.

## Overview

This feature handles displaying table data with multiple view modes (grid, transpose, text), sorting, filtering, selection, copying, and exporting.

## Components

### Table Viewer

- **AdvancedTableViewer** - Main coordinator component for table display
- **GridView** - Traditional grid/spreadsheet view
- **TransposeView** - Transposed view (columns become rows)
- **TextView** - Plain text view with alignment options
- **TableToolbar** - Toolbar with search, export, and view controls
- **TableHeader** - Header with search and export buttons
- **TableFooter** - Footer with row count and sort info

### Table List

- **TablesPage** - Page displaying list of tables
- **TableCard** - Card view for a table
- **TableRow** - Row view for a table
- **SchemaGroup** - Grouped tables by schema

### Other

- **TableStructure** - View table column structure
- **TablePreviewDialog** - Quick preview dialog
- **DatabaseBrowser** - Tree browser for databases

## Hooks

- **useTableSort** - Sorting state management
- **useTableSelection** - Row selection and expansion
- **useTableCopy** - Cell and row copying
- **useTableExport** - CSV and JSON export
- **useTableResize** - Column and row resizing
- **useTableKeyboardShortcuts** - Keyboard navigation

## Stores

- **useTableStore** - Table-specific column widths and row heights
- **useTableViewModeStore** - View mode per table (grid/transpose/text)
- **useTableDensityStore** - Density mode per table
- **useTableOptionsStore** - Display options (row numbers, zebra, etc.)
- **useTextViewOptionsStore** - Text view specific options
- **useTableColumnStore** - Hidden and pinned columns
- **useTableListStore** - Table list view mode

## Usage

```tsx
import {
  AdvancedTableViewer,
  useTableSort,
  useTableViewModeStore,
} from "@features/table-explorer";

function TablePage({ dbName, tableName, columns, rows }) {
  return (
    <AdvancedTableViewer
      dbName={dbName}
      tableName={tableName}
      columns={columns}
      rows={rows}
    />
  );
}
```

## Exports

All components, hooks, stores, and utilities are exported through the feature's `index.ts`.
