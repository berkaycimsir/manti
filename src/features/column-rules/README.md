# Column Rules Feature

Column transformations and filters for Manti table data.

## Overview

This feature handles column-level transformations (formatting, masking, etc.) and filters that can be applied globally or per-table to customize how data is displayed.

## Components

- **TransformationSidebar** - Sidebar for managing column transformations
- **FilterSidebar** - Sidebar for managing column filters
- **GlobalRulesTab** - Tab view for global transformation/filter rules
- **GlobalRulesCard** - Card display for a global rule

### Shared Components

- **RuleCard** - Reusable card for displaying a rule
- **OptionsEditor** - Editor for transformation/filter options
- **LucideIcon** - Dynamic icon loader for rule icons

## Hooks

- **useColumnConfig** - Hook for managing table-specific column configurations
- **useGlobalRules** - Hook for managing global transformation/filter rules

## Utils

- **mergeTransformations** - Merge global and table-specific transformations
- **mergeFilters** - Merge global and table-specific filters
- **applyTransformation** - Apply a transformation to a value
- **applyFilter** - Check if a value passes a filter

## Types

- **TransformationType** - Available transformation types
- **TransformationConfig** - Configuration for a transformation
- **FilterType** - Available filter types
- **FilterConfig** - Configuration for a filter

## Usage

```tsx
import {
  TransformationSidebar,
  FilterSidebar,
  useColumnConfig,
  useGlobalRules,
  applyTransformation,
  applyFilter,
  mergeTransformations,
} from "@features/column-rules";

// Apply transformations to table data
function TableCell({ value, columnName }) {
  const { transformations } = useColumnConfig(dbName, tableName);
  const merged = mergeTransformations(transformations);
  const config = merged.find(t => t.columnName === columnName);
  
  return (
    <span>
      {config ? applyTransformation(value, config) : String(value)}
    </span>
  );
}
```

## Exports

```typescript
export * from "./types";
export * from "./constants";
export { TransformationSidebar } from "./components/transformation-sidebar";
export { FilterSidebar } from "./components/filter-sidebar";
export { GlobalRulesTab } from "./components/global-rules-tab";
export { useColumnConfig } from "./hooks/use-column-config";
export { useGlobalRules } from "./hooks/use-global-rules";
export { mergeTransformations, mergeFilters } from "./utils/merge-rules";
export { applyTransformation, applyFilter } from "./utils/apply-transformation";
```
