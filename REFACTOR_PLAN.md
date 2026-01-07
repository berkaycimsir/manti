# 🏗️ COMPREHENSIVE ARCHITECTURE REFACTOR PLAN

## Manti - PostgreSQL Database Management Application

> **Status**: Planning Phase  
> **Created**: January 7, 2026  
> **Last Updated**: January 7, 2026

---

# SECTION 1 — High-Level Diagnosis

## Overall Architecture Quality Score: **5.5/10**

The application demonstrates typical LLM-generated patterns with reasonable functionality but inconsistent architecture. While basic features work, the codebase lacks clear boundaries, has redundant abstractions, and mixes concerns throughout.

---

## Top 10 Architectural Issues

### 1. **No Feature/Domain Boundaries**
- [x] Create `/features` directory structure
- [x] Move components to feature folders

Files are organized by technical type (components, hooks, stores) rather than by feature domain. This creates tight coupling and makes it difficult to understand which files belong together.

**Evidence:**
- `transformation-sidebar.tsx` imports from 6+ different locations
- Filter logic split across `filter-sidebar.tsx`, `use-column-config.ts`, `column-config-utils.ts`, `types/filters.ts`

### 2. **Scattered Type Definitions**
- [x] Fix circular type imports
- [x] Consolidate duplicate type definitions
- [x] Move inline types to proper type files

Types are inconsistently defined - some in dedicated files, others inline, some imported from components (anti-pattern).

**Evidence:**
- `types/table.ts` imports `FilterConfig` from a **component** (`~/components/database/filter-sidebar`)
- Same types defined in multiple places (`TransformationType`, `Column`, `Row`)

### 3. **Monolithic tRPC Routers with Business Logic**
- [x] Create service layer between routers and database
- [x] Split oversized routers into focused modules

Database operations, validation, and business logic are all mixed within tRPC procedures.

**Evidence:**
- `connection.ts` (522 lines) - CRUD, validation, encryption, connection testing all in one file
- `table-config.ts` (507 lines) - both global and table-specific rules with repeated patterns

### 4. **Zustand Store Proliferation**
- [x] Split `table-view-store.ts` into separate stores
- [x] Rename confusing store files
- [x] Document store ownership rules

10 separate stores with overlapping concerns, unclear boundaries, and inconsistent patterns.

**Evidence:**
- `table-store.ts` vs `table-view-store.ts` vs `tables-view-store.ts` - confusing naming
- `table-view-store.ts` contains 4 separate stores in one file (violates single responsibility)
- Some stores use persistence, others don't, with no clear rationale

### 5. **Header Configuration Pattern Anti-Pattern**
- [x] Replace header store with Context pattern
- [x] Remove ReactNode from Zustand state

Using a global store for header configuration creates implicit dependencies and makes component testing difficult.

**Evidence:**
- `header-store.ts` contains `ReactNode` in state - mixing React with state
- Every page must call `useHeader()` correctly or the header breaks

### 6. **Inconsistent Constants/Config Organization**
- [x] Merge scattered constants into feature-specific files
- [x] Delete empty `lib/constants/` folder after migration

Constants scattered across multiple locations with no clear pattern.

**Evidence:**
- `~/lib/constants.ts` - timing constants
- `~/lib/constants/` folder - transformation/filter options
- `~/config/` folder - theme config
- Inline constants in components

### 7. **Mixed Client/Server Type Boundaries**
- [x] Create separate client and server type files
- [x] Ensure server types never imported into client bundles

No clear separation between types used by server vs client, leading to potential bundle bloat.

**Evidence:**
- `types/transformations.ts` defines both API records (`TransformationRecord`) and UI config (`TransformationConfig`) in same file
- `types/table.ts` exports constants and types together

### 8. **Overloaded "Database" Components Folder**
- [x] Move database components to feature folders
- [x] Delete empty `components/database/` folder after migration

The `components/database/` folder is a dumping ground with no internal organization.

**Evidence:**
- 13+ files at root level
- Mix of sidebars, viewers, tabs, forms, cards
- Shared folder exists but underutilized

### 9. **Repeated Mutation Patterns in Hooks**
- [x] Create shared mutation factory
- [x] Standardize invalidation patterns

Multiple hooks have nearly identical tRPC mutation setup code.

**Evidence:**
- `use-column-config.ts` - 6 mutations with similar patterns
- `use-global-rules.ts` - duplicate mutation wrappers
- No shared mutation factory

### 10. **Inconsistent Error Handling**
- [x] Create error boundary components
- [x] Standardize error types
- [x] Add global error handler for mutations

Error handling varies between components and API routes with no standardized approach.

**Evidence:**
- Some procedures throw `TRPCError`, others re-throw generic errors
- No error boundary components
- No standardized error types

---

## Why These Issues Exist

1. **Incremental LLM Generation**: Features added one at a time without considering overall structure
2. **Copy-Paste Driven Development**: Similar patterns duplicated rather than abstracted
3. **No Upfront Architecture**: Started as a simple app, grew organically
4. **Multiple Generation Sessions**: Different LLM sessions introduced inconsistent patterns
5. **Focus on Features Over Structure**: Priority on "making it work" over maintainability

---

# SECTION 2 — Target Architecture (FINAL STATE)

## Proposed Folder Structure

```
src/
├── app/                              # Next.js App Router (routing only)
│   ├── layout.tsx
│   ├── page.tsx                      # Landing page
│   ├── (auth)/
│   │   ├── sign-in/page.tsx
│   │   └── sign-up/page.tsx
│   ├── api/
│   │   ├── auth/[...all]/route.ts
│   │   └── trpc/[trpc]/route.ts
│   └── (dashboard)/                  # Protected routes group
│       ├── layout.tsx                # Dashboard shell with sidebar
│       ├── page.tsx                  # Redirect to /connections
│       ├── connections/
│       │   └── page.tsx
│       ├── settings/
│       │   └── page.tsx
│       └── [connectionId]/           # Dynamic connection routes
│           ├── layout.tsx
│           ├── page.tsx              # Redirect to tables
│           ├── tables/
│           │   ├── page.tsx
│           │   └── [tableName]/page.tsx
│           ├── query/
│           │   ├── page.tsx
│           │   ├── new/page.tsx
│           │   └── [queryId]/page.tsx
│           ├── info/page.tsx
│           └── settings/page.tsx
│
├── features/                         # Feature-based modules
│   ├── auth/
│   │   ├── components/
│   │   │   ├── sign-in-form.tsx
│   │   │   └── sign-up-form.tsx
│   │   ├── hooks/
│   │   │   └── use-auth.ts
│   │   └── index.ts                  # Public exports
│   │
│   ├── connections/                  # Database connections feature
│   │   ├── components/
│   │   │   ├── connection-card.tsx
│   │   │   ├── connection-row.tsx
│   │   │   ├── connection-form.tsx
│   │   │   ├── connection-list.tsx
│   │   │   └── connection-settings.tsx
│   │   ├── hooks/
│   │   │   ├── use-connections.ts
│   │   │   └── use-connection-mutations.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── table-explorer/               # Table viewing feature
│   │   ├── components/
│   │   │   ├── table-viewer/
│   │   │   │   ├── table-viewer.tsx
│   │   │   │   ├── grid-view.tsx
│   │   │   │   ├── transpose-view.tsx
│   │   │   │   ├── text-view.tsx
│   │   │   │   └── table-toolbar.tsx
│   │   │   ├── table-list/
│   │   │   │   ├── table-card.tsx
│   │   │   │   ├── table-row.tsx
│   │   │   │   └── schema-group.tsx
│   │   │   └── table-structure.tsx
│   │   ├── hooks/
│   │   │   ├── use-table-data.ts
│   │   │   ├── use-table-sort.ts
│   │   │   ├── use-table-selection.ts
│   │   │   └── use-table-export.ts
│   │   ├── stores/
│   │   │   ├── table-view-store.ts
│   │   │   └── table-density-store.ts
│   │   ├── utils/
│   │   │   └── table-helpers.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── column-rules/                 # Transformations & Filters
│   │   ├── components/
│   │   │   ├── transformation-sidebar.tsx
│   │   │   ├── filter-sidebar.tsx
│   │   │   ├── global-rules-tab.tsx
│   │   │   ├── global-rules-card.tsx
│   │   │   └── shared/
│   │   │       ├── options-editor.tsx
│   │   │       ├── toggle-switch.tsx
│   │   │       └── rule-card.tsx
│   │   ├── hooks/
│   │   │   ├── use-column-config.ts
│   │   │   └── use-global-rules.ts
│   │   ├── utils/
│   │   │   ├── merge-rules.ts
│   │   │   ├── apply-transformation.ts
│   │   │   └── apply-filter.ts
│   │   ├── constants.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── saved-queries/                # Query management feature
│   │   ├── components/
│   │   │   ├── query-editor.tsx
│   │   │   ├── query-card.tsx
│   │   │   ├── query-tabs-manager.tsx
│   │   │   ├── kanban-board.tsx
│   │   │   └── sql-preview.tsx
│   │   ├── hooks/
│   │   │   ├── use-saved-queries.ts
│   │   │   └── use-query-tabs.ts
│   │   ├── stores/
│   │   │   └── query-view-store.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   └── settings/                     # User & app settings
│       ├── components/
│       │   ├── profile-tab.tsx
│       │   ├── security-tab.tsx
│       │   ├── data-storage-tab.tsx
│       │   └── danger-tab.tsx
│       ├── hooks/
│       │   └── use-settings.ts
│       └── index.ts
│
├── shared/                           # Shared across features
│   ├── components/
│   │   ├── ui/                       # shadcn/ui components (unchanged)
│   │   │   └── [all current ui components]
│   │   ├── layout/
│   │   │   ├── dashboard-shell.tsx
│   │   │   ├── page-header.tsx
│   │   │   ├── sidebar.tsx
│   │   │   └── sidebar-components/
│   │   ├── feedback/
│   │   │   ├── error-boundary.tsx
│   │   │   ├── loading-states.tsx
│   │   │   └── empty-states.tsx
│   │   └── common/
│   │       ├── lucide-icon.tsx
│   │       ├── theme-toggle.tsx
│   │       └── truncated-text.tsx
│   ├── hooks/
│   │   ├── use-local-storage.ts
│   │   ├── use-keyboard-shortcut.ts
│   │   └── use-debounce.ts
│   ├── stores/
│   │   ├── layout-store.ts
│   │   ├── theme-store.ts
│   │   └── global-settings-store.ts
│   ├── lib/
│   │   ├── utils.ts                  # cn, formatRelativeTime, etc.
│   │   ├── constants.ts              # Global app constants
│   │   └── validators.ts             # Shared zod schemas
│   └── types/
│       └── common.ts                 # Shared utility types
│
├── server/                           # Server-only code
│   ├── api/
│   │   ├── root.ts
│   │   ├── trpc.ts
│   │   └── routers/
│   │       ├── auth.ts
│   │       ├── user-data.ts
│   │       └── database/
│   │           ├── index.ts
│   │           ├── connection.router.ts
│   │           ├── table.router.ts
│   │           ├── query.router.ts
│   │           ├── tab.router.ts
│   │           └── column-rules.router.ts
│   ├── services/                     # Business logic layer
│   │   ├── connection.service.ts
│   │   ├── query.service.ts
│   │   └── column-rules.service.ts
│   ├── db/
│   │   ├── index.ts
│   │   ├── schema.ts
│   │   ├── connection-pool.ts
│   │   ├── encryption.ts
│   │   └── query-executor.ts
│   └── lib/
│       └── auth.ts
│
├── config/
│   ├── env.ts                        # Environment validation
│   ├── theme.ts
│   └── app.ts                        # App-wide configuration
│
├── trpc/                             # tRPC client setup (keep as-is)
│   ├── query-client.ts
│   ├── react.tsx
│   └── server.ts
│
├── styles/
│   ├── globals.css
│   └── themes.css
│
└── middleware.ts
```

---

## Folder Explanations

### `/app` - Routing Only
- **Purpose**: Pure routing layer, minimal logic
- **Rules**: 
  - Pages should be thin wrappers importing from features
  - No business logic
  - Layout handles shell, pages handle feature composition

### `/features` - Feature Modules
- **Purpose**: Self-contained feature domains
- **Rules**:
  - Each feature owns its components, hooks, stores, types, utils
  - Cross-feature imports only through public `index.ts` exports
  - Features can import from `shared/` but not from other features

### `/shared` - Cross-Cutting Concerns
- **Purpose**: Truly reusable code that doesn't belong to any feature
- **Rules**:
  - Must be generic and feature-agnostic
  - UI primitives, layout components, utility hooks
  - If it references a specific feature, it belongs in that feature

### `/server` - Server-Only Code
- **Purpose**: All backend logic
- **Rules**:
  - Clear separation: routers → services → db
  - Never import into client code (except types)
  - Services contain business logic, routers are thin

---

## State Ownership Rules

| State Type | Owner | Storage |
|------------|-------|---------|
| Auth/Session | Server | Better-Auth session |
| User Preferences | `shared/stores/global-settings-store.ts` | localStorage (persist) |
| Theme | `shared/stores/theme-store.ts` | localStorage (persist) |
| Layout UI (sidebar open) | `shared/stores/layout-store.ts` | Memory |
| Table View Mode | `features/table-explorer/stores/` | localStorage |
| Query View Mode | `features/saved-queries/stores/` | localStorage |
| Connection Data | tRPC cache | Server |
| Form State | Local component state | Memory |

---

# SECTION 3 — Design Rules & Conventions

## File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| React Components | `kebab-case.tsx` | `connection-card.tsx` |
| Hooks | `use-kebab-case.ts` | `use-connections.ts` |
| Stores | `kebab-case-store.ts` | `table-view-store.ts` |
| Types | `types.ts` (feature) or `kebab-case.ts` (shared) | `types.ts` |
| Utils | `kebab-case.ts` | `merge-rules.ts` |
| Constants | `constants.ts` | `constants.ts` |
| Services | `kebab-case.service.ts` | `connection.service.ts` |
| Routers | `kebab-case.router.ts` | `connection.router.ts` |

## Folder Placement Rules

```
Decision Tree for File Placement:

Is it server-only code?
├── YES → /server/
│   ├── Is it a tRPC procedure? → /server/api/routers/
│   ├── Is it business logic? → /server/services/
│   └── Is it database access? → /server/db/
└── NO (client or shared)
    ├── Is it a UI primitive (shadcn)? → /shared/components/ui/
    ├── Is it used by 3+ features? → /shared/
    └── Does it belong to ONE feature?
        └── YES → /features/{feature-name}/
```

## Import Boundaries

```typescript
// ✅ ALLOWED imports
import { Button } from "~/shared/components/ui/button";
import { useConnections } from "~/features/connections";
import { cn } from "~/shared/lib/utils";

// ❌ FORBIDDEN imports  
import { ConnectionCard } from "~/features/connections/components/connection-card"; // bypass index
import { someHelper } from "~/features/other-feature/utils"; // cross-feature internal
import { TransformationConfig } from "~/components/database/filter-sidebar"; // type from component
```

## Component Responsibility Matrix

| Category | Responsibility | State Allowed | Data Fetching |
|----------|---------------|---------------|---------------|
| **Page Components** | Route composition, layout | None | Via props from server component |
| **Feature Components** | Feature-specific UI + logic | Local + Feature stores | Via feature hooks |
| **Shared Layout** | Shell, navigation, headers | Layout store only | None |
| **UI Primitives** | Presentation only | None | Never |

## State Usage Rules

### When to Use Zustand
✅ DO use for:
- Cross-component state within a feature
- Persisted user preferences
- UI state that survives navigation

❌ DON'T use for:
- Server data (use tRPC/React Query)
- Form state (use local state)
- State used by one component (use useState)
- Derived state (compute from source)

### Store Structure
```typescript
// ✅ GOOD: Focused, single-purpose store
interface TableViewStore {
  viewMode: "grid" | "transpose" | "text";
  setViewMode: (mode: ViewMode) => void;
}

// ❌ BAD: Kitchen sink store
interface BadStore {
  viewMode: ViewMode;
  density: Density;
  options: TableOptions;
  textOptions: TextOptions;
  // ... 20 more properties
}
```

## Server/Client Separation Rules

```typescript
// /server/types.ts - Server-only types
export interface DatabaseConnectionRow {
  id: number;
  encryptedPassword: string; // server-only field
}

// /features/connections/types.ts - Client types
export interface Connection {
  id: number;
  name: string;
  // No sensitive fields
}
```

---

# SECTION 4 — Refactor Strategy (SAFE & INCREMENTAL)

## Phase 1: Non-Breaking Cleanup (Low Risk)

**Duration**: 1-2 days  
**Risk Level**: 🟢 Low  
**Breaking Changes**: None

### TODO Checklist
- [x] Fix circular/improper type imports
- [x] Consolidate duplicate type definitions
- [x] Move inline types to proper type files
- [x] Add barrel exports (`index.ts`) to existing folders
- [x] Rename confusing files (e.g., `tables-view-store.ts` → `table-list-view-store.ts`)
- [x] Clean up unused imports and dead code

### What NOT to Touch
- Component logic
- API routes
- Store implementations
- Any working functionality

### Specific Actions
```bash
# Fix: types/table.ts imports from component
# Move FilterConfig to types/filters.ts (already exists)
# Update all consumers

# Create missing barrel exports
touch src/components/database/shared/index.ts  # ✓ already exists
touch src/components/database/table/index.ts   # ✓ already exists
touch src/stores/index.ts                       # NEW

# Rename for clarity
mv src/stores/tables-view-store.ts src/stores/table-list-store.ts
```

### Expected Benefits
- Cleaner imports throughout codebase
- Single source of truth for types
- Foundation for larger refactors

---

## Phase 2: Structural Reorganization (Medium Risk)

**Duration**: 3-4 days  
**Risk Level**: 🟡 Medium  
**Breaking Changes**: Import paths change (can be auto-fixed)

### TODO Checklist
- [x] Create `/features` directory structure
- [x] Move components to feature folders
- [x] Move feature-specific hooks to feature folders
- [x] Move feature-specific stores to feature folders
- [x] Update all import paths
- [x] Create public exports for each feature

### What NOT to Touch
- Server code (Phase 4)
- Core shared utilities
- UI primitives
- Authentication flow

### Migration Order
```
1. features/connections/     # Simplest, well-isolated
2. features/settings/        # Already mostly isolated
3. features/column-rules/    # Complex but contained
4. features/table-explorer/  # Largest, most dependencies
5. features/saved-queries/   # Depends on table-explorer
```

### Specific Actions for `connections` feature
```bash
mkdir -p src/features/connections/{components,hooks,types}

# Move files
mv src/components/home/connection-card.tsx src/features/connections/components/
mv src/components/home/connection-row.tsx src/features/connections/components/
mv src/components/database/add-connection-form.tsx src/features/connections/components/connection-form.tsx
mv src/components/connection-modal.tsx src/features/connections/components/

# Create types file from scattered definitions
# Create barrel export
```

### Expected Benefits
- Clear feature ownership
- Easier to understand codebase
- Foundation for feature teams

---

## Phase 3: Logic Extraction (Medium-High Risk)

**Duration**: 3-4 days  
**Risk Level**: 🟠 Medium-High  
**Breaking Changes**: Hook APIs may change

### TODO Checklist
- [x] Extract shared mutation patterns into factory
- [x] Create unified error handling
- [x] Consolidate merge logic (transformations/filters)
- [x] Extract header config from global store to context
- [x] Create proper loading/error boundaries

### What NOT to Touch
- Core business logic
- Database schema
- tRPC router structure (yet)

### Pattern: Mutation Factory
```typescript
// Before: Repeated in every hook
const createMutation = api.database.createConnection.useMutation({
  onSuccess: () => utils.database.listConnections.invalidate(),
});

// After: Shared factory
function useConnectionMutation<T extends keyof ConnectionMutations>(
  mutation: T,
  options?: MutationOptions<T>
) {
  return api.database[mutation].useMutation({
    onSuccess: () => {
      utils.database.listConnections.invalidate();
      options?.onSuccess?.();
    },
    onError: handleMutationError,
  });
}
```

### Pattern: Header Context
```typescript
// Before: Global store with ReactNode
const useHeaderStore = create<{
  headerConfig: { title: string; actions?: ReactNode };
}>();

// After: Context provider in layout
<HeaderProvider>
  {children}
</HeaderProvider>

// In page
const { setHeader } = useHeader();
useEffect(() => {
  setHeader({ title: "Tables", actions: <ExportButton /> });
}, []);
```

### Expected Benefits
- DRY mutation code
- Consistent error handling
- Testable header configurations

---

## Phase 4: Server Architecture (High Risk)

**Duration**: 4-5 days  
**Risk Level**: 🔴 High  
**Breaking Changes**: API contracts may shift

### TODO Checklist
- [x] Create service layer between routers and database
- [x] Split oversized routers into focused modules
- [x] Centralize validation schemas
- [x] Standardize error responses
- [x] Add input sanitization layer

### What NOT to Touch
- Client code
- Database schema
- Auth system

### Architecture Pattern
```
Current:                         Target:
┌─────────────────┐             ┌─────────────────┐
│   tRPC Router   │             │   tRPC Router   │ ← Thin, validation only
│  (everything)   │             └────────┬────────┘
└────────┬────────┘                      │
         │                      ┌────────▼────────┐
         │                      │    Service      │ ← Business logic
         │                      └────────┬────────┘
┌────────▼────────┐             ┌────────▼────────┐
│    Database     │             │   Repository    │ ← Data access
└─────────────────┘             └────────┬────────┘
                                ┌────────▼────────┐
                                │    Database     │
                                └─────────────────┘
```

### Example: Connection Router Refactor
```typescript
// Before: 522-line router with everything
export const connectionRouter = createTRPCRouter({
  createConnection: protectedProcedure
    .input(connectionInputSchema)
    .mutation(async ({ ctx, input }) => {
      // 50 lines of encryption, validation, testing, inserting
    }),
});

// After: Thin router + service
// connection.router.ts
export const connectionRouter = createTRPCRouter({
  createConnection: protectedProcedure
    .input(connectionInputSchema)
    .mutation(({ ctx, input }) => 
      connectionService.createConnection(ctx.userId, input)
    ),
});

// connection.service.ts
export const connectionService = {
  async createConnection(userId: string, input: ConnectionInput) {
    const encrypted = encryptCredentials(input);
    const connection = await connectionRepository.insert(userId, encrypted);
    await this.testConnection(connection);
    return connection;
  },
};
```

### Expected Benefits
- Testable business logic
- Reusable services
- Cleaner routers

---

## Phase 5: Final Hardening (Low Risk)

**Duration**: 2-3 days  
**Risk Level**: 🟢 Low  
**Breaking Changes**: None

### TODO Checklist
- [x] Add comprehensive barrel exports
- [x] Write architectural documentation
- [x] Add path aliases for features
- [x] Set up import linting rules (documented in ARCHITECTURE.md)
- [x] Create developer onboarding guide
- [x] Add feature README files

### What NOT to Touch
- Any working code
- Any logic

### Path Alias Updates
```json
// tsconfig.json
{
  "paths": {
    "~/*": ["./src/*"],
    "@features/*": ["./src/features/*"],
    "@shared/*": ["./src/shared/*"],
    "@server/*": ["./src/server/*"]
  }
}
```

### ESLint Rules
```javascript
// .eslintrc.js
{
  rules: {
    "import/no-restricted-paths": [
      "error",
      {
        zones: [
          // Features cannot import from other features' internals
          {
            target: "./src/features/connections/**/*",
            from: "./src/features/!(connections)/**/*",
          },
          // Client cannot import server internals
          {
            target: "./src/features/**/*",
            from: "./src/server/**/*",
            except: ["./src/server/api/types.ts"],
          },
        ],
      },
    ],
  },
}
```

### Expected Benefits
- Enforced architecture
- Easy onboarding
- Documented conventions

---

# SECTION 5 — Feature-by-Feature Refactor Plan

## Feature: Connections

### Current Problems
- Components scattered: `components/home/`, `components/database/`, root `components/`
- No feature-level hook for connection operations
- Form and modal tightly coupled
- Types imported from router file

### TODO Checklist
- [x] Create `features/connections/` directory structure
- [x] Move `connection-card.tsx` from `components/home/`
- [x] Move `connection-row.tsx` from `components/home/`
- [x] Move `connections-header.tsx` from `components/home/`
- [x] Move `connection-modal.tsx` from `components/`
- [x] Move `add-connection-form.tsx` → `connection-form.tsx`
- [x] Move `connection-list.tsx` from `components/database/`
- [x] Move `connection-settings-sidebar.tsx` → `connection-settings.tsx`
- [x] Create `features/connections/types.ts`
- [x] Create `features/connections/hooks/use-connections.ts`
- [x] Create `features/connections/hooks/use-connection-mutations.ts`
- [x] Create `features/connections/index.ts` (public exports)
- [x] Delete empty `components/home/` folder

### Proposed Structure
```
features/connections/
├── components/
│   ├── connection-card.tsx
│   ├── connection-row.tsx
│   ├── connection-form.tsx
│   ├── connection-list.tsx
│   ├── connection-modal.tsx
│   └── connection-settings.tsx
├── hooks/
│   ├── use-connections.ts
│   └── use-connection-mutations.ts
├── types.ts
└── index.ts
```

---

## Feature: Column Rules (Transformations & Filters)

### Current Problems
- Complex merge logic in multiple places
- Duplicate sidebar patterns (transformation vs filter)
- Constants split between lib/constants/ and inline
- Types scattered across 3+ files

### TODO Checklist
- [x] Create `features/column-rules/` directory structure
- [x] Move `transformation-sidebar.tsx`
- [x] Move `filter-sidebar.tsx`
- [x] Move `global-rules-tab.tsx`
- [x] Move `global-rules-card.tsx`
- [x] Move shared components to `features/column-rules/components/shared/`
- [x] Move `use-column-config.ts` to feature hooks
- [x] Move `use-global-rules.ts` to feature hooks
- [x] Merge `transformation-options.ts` + `filter-options.ts` → `constants.ts`
- [x] Move `column-config-utils.ts` → `utils/merge-rules.ts`
- [x] Split `transformations.ts` → `utils/apply-transformation.ts`
- [x] Merge `types/transformations.ts` + `types/filters.ts` → `types.ts`
- [x] Create `features/column-rules/index.ts` (public exports)
- [x] Delete `lib/constants/` folder

### Proposed Structure
```
features/column-rules/
├── components/
│   ├── transformation-sidebar.tsx
│   ├── filter-sidebar.tsx
│   ├── global-rules-tab.tsx
│   ├── global-rules-card.tsx
│   └── shared/
│       ├── rule-card.tsx
│       ├── options-editor.tsx
│       └── toggle-switch.tsx
├── hooks/
│   ├── use-column-config.ts
│   └── use-global-rules.ts
├── utils/
│   ├── merge-rules.ts
│   ├── apply-transformation.ts
│   └── apply-filter.ts
├── constants.ts
├── types.ts
└── index.ts
```

---

## Feature: Table Explorer

### Current Problems
- Monster `advanced-table-viewer.tsx` (554 lines)
- Multiple view modes mixed in one file
- Store contains 4 stores in one file
- Table actions hook has too many responsibilities

### TODO Checklist
- [x] Create `features/table-explorer/` directory structure
- [x] Split `advanced-table-viewer.tsx` into coordinator + views
- [x] Move table viewer components to `components/table-viewer/`
- [x] Move table list components to `components/table-list/`
- [x] Split `use-table-actions.ts` into 5 focused hooks
- [x] Move `table-store.ts` to feature stores
- [x] Split `table-view-store.ts` into 4 separate stores
- [x] Rename `tables-view-store.ts` → `table-list-store.ts`
- [x] Create `features/table-explorer/types.ts`
- [x] Create `features/table-explorer/index.ts` (public exports)

### Proposed Structure
```
features/table-explorer/
├── components/
│   ├── table-viewer/
│   │   ├── table-viewer.tsx
│   │   ├── grid-view.tsx
│   │   ├── transpose-view.tsx
│   │   ├── text-view.tsx
│   │   ├── table-toolbar.tsx
│   │   ├── table-header.tsx
│   │   └── table-footer.tsx
│   ├── table-list/
│   │   ├── tables-page.tsx
│   │   ├── table-card.tsx
│   │   ├── table-row.tsx
│   │   └── schema-group.tsx
│   └── table-structure.tsx
├── hooks/
│   ├── use-table-data.ts
│   ├── use-table-sort.ts
│   ├── use-table-selection.ts
│   ├── use-table-export.ts
│   ├── use-table-copy.ts
│   └── use-table-resize.ts
├── stores/
│   ├── view-mode-store.ts
│   ├── density-store.ts
│   ├── column-visibility-store.ts
│   └── table-options-store.ts
├── utils/
│   └── table-helpers.ts
├── types.ts
└── index.ts
```

---

## Feature: Saved Queries

### Current Problems
- Query components scattered in `components/database/query/`
- Query view store separate from feature
- Tab management mixed with query logic

### TODO Checklist
- [x] Create `features/saved-queries/` directory structure
- [x] Move all `components/database/query/*` components
- [x] Move `use-dashboard-tabs.tsx` → `hooks/use-query-tabs.ts`
- [x] Move `query-view-store.ts` to feature stores
- [x] Create `features/saved-queries/types.ts`
- [x] Create `features/saved-queries/index.ts` (public exports)

### Proposed Structure
```
features/saved-queries/
├── components/
│   ├── query-list.tsx
│   ├── query-card.tsx
│   ├── query-editor.tsx
│   ├── query-tabs-manager.tsx
│   ├── kanban-board.tsx
│   └── sql-preview.tsx
├── hooks/
│   ├── use-saved-queries.ts
│   └── use-query-tabs.ts
├── stores/
│   └── query-view-store.ts
├── types.ts
└── index.ts
```

---

## Feature: Settings

### Current Problems
- Settings tabs have no shared abstraction
- Auth hooks scattered
- Data explorer deeply nested

### TODO Checklist
- [x] Create `features/settings/` directory structure
- [x] Move settings tab components
- [x] Move `use-settings.ts` to feature hooks
- [x] Create `features/settings/index.ts` (public exports)

### Proposed Structure
```
features/settings/
├── components/
│   ├── settings-layout.tsx
│   ├── settings-sidebar.tsx
│   ├── profile-tab.tsx
│   ├── security-tab.tsx
│   ├── data-storage-tab.tsx
│   └── danger-tab.tsx
├── hooks/
│   └── use-settings.ts
└── index.ts
```

---

# SECTION 6 — Anti-Patterns to Eliminate

## 1. Type Import from Components

**❌ Current Pattern**
```typescript
// types/table.ts
import type { FilterConfig } from "~/components/database/filter-sidebar";
```

**Why Harmful**: Creates circular dependencies, breaks module boundaries, makes components untestable.

**✅ Replacement**
```typescript
// types/filters.ts (already exists!)
export interface FilterConfig { ... }

// components/database/filter-sidebar.tsx
import type { FilterConfig } from "~/types/filters";
```

### TODO
- [x] Fix `types/table.ts` to import from `types/filters.ts`
- [x] Update all consumers

---

## 2. Multiple Stores in One File

**❌ Current Pattern**
```typescript
// table-view-store.ts
export const useTextViewOptionsStore = create<...>();
export const useTableDensityStore = create<...>();
export const useTableViewModeStore = create<...>();
export const useTableOptionsStore = create<...>();
```

**Why Harmful**: Violates single responsibility, makes stores harder to find, causes unnecessary re-renders.

**✅ Replacement**
```
stores/
├── text-view-store.ts
├── density-store.ts
├── view-mode-store.ts
└── table-options-store.ts
```

### TODO
- [x] Split `table-view-store.ts` into 4 separate files
- [x] Update all imports

---

## 3. ReactNode in Zustand Store

**❌ Current Pattern**
```typescript
// header-store.ts
interface HeaderConfig {
  actions?: ReactNode;
  floatingActions?: ReactNode;
}
```

**Why Harmful**: Zustand stores should be serializable, ReactNode breaks devtools, makes testing impossible.

**✅ Replacement**
```typescript
// Use Context for component injection
const HeaderContext = createContext<{
  setActions: (node: ReactNode) => void;
}>();

// Or use render props pattern
interface HeaderConfig {
  renderActions?: () => ReactNode;
}
```

### TODO
- [x] Create `HeaderContext` provider
- [x] Migrate `useHeader` to use context
- [x] Remove ReactNode from header store

---

## 4. God Components

**❌ Current Pattern**
```tsx
// advanced-table-viewer.tsx (554 lines)
export const AdvancedTableViewer = () => {
  // Handles: sorting, filtering, selection, export, 
  // copy, resize, view modes, density, etc.
}
```

**Why Harmful**: Impossible to test, maintain, or understand. Changes are risky.

**✅ Replacement**
```tsx
// table-viewer.tsx (coordinator)
export function TableViewer(props) {
  const { viewMode } = useViewMode();
  
  return (
    <>
      <TableToolbar />
      {viewMode === "grid" && <GridView {...props} />}
      {viewMode === "transpose" && <TransposeView {...props} />}
      {viewMode === "text" && <TextView {...props} />}
      <TableFooter />
    </>
  );
}
```

### TODO
- [x] Split `advanced-table-viewer.tsx` into coordinator + views
- [x] Extract toolbar, footer, and view components

---

## 5. Utility Dumping Ground

**❌ Current Pattern**
```
lib/
├── utils.ts           # cn, formatRelativeTime, isProduction, isLocalConnection
├── constants.ts       # Just timing constants
├── transformations.ts # Types + apply functions
├── column-config-utils.ts # Merge functions
├── settings-utils.ts
├── local-storage-utils.ts
└── constants/
    ├── transformation-options.ts
    └── filter-options.ts
```

**Why Harmful**: No clear organization, imports become guesswork, easy to create duplicates.

**✅ Replacement**
```
shared/lib/
├── utils.ts           # Only cn, nothing else
└── format.ts          # formatRelativeTime, formatDate

features/column-rules/
├── constants.ts       # All transformation/filter constants
└── utils/
    ├── merge-rules.ts
    ├── apply-transformation.ts
    └── apply-filter.ts
```

### TODO
- [x] Create `shared/lib/format.ts` for date/time formatting
- [x] Keep `shared/lib/utils.ts` minimal (only `cn`)
- [x] Move feature-specific utils to features

---

## 6. Copy-Paste Mutations

**❌ Current Pattern**
```typescript
// Repeated in every hook
const createMutation = api.database.createX.useMutation({
  onSuccess: () => {
    void utils.database.listX.invalidate();
  },
});
const updateMutation = api.database.updateX.useMutation({
  onSuccess: () => {
    void utils.database.listX.invalidate();
  },
});
// ... same pattern 20 times
```

**Why Harmful**: DRY violation, inconsistent invalidation, no central error handling.

**✅ Replacement**
```typescript
// shared/hooks/use-mutation-with-invalidation.ts
function useMutationWithInvalidation<T>(
  mutation: UseMutationResult<T>,
  invalidations: QueryKey[]
) {
  return useMutation({
    ...mutation,
    onSuccess: (data) => {
      invalidations.forEach(key => queryClient.invalidateQueries(key));
      mutation.onSuccess?.(data);
    },
    onError: handleGlobalError,
  });
}
```

### TODO
- [x] Create `useMutationWithInvalidation` hook
- [x] Refactor existing mutation patterns
- [x] Add global error handler

---

## 7. Magic Hooks

**❌ Current Pattern**
```typescript
// useHeader must be called in every page
// If forgotten, header breaks silently
export default function SomePage() {
  useHeader({ title: "Page" }); // Easy to forget!
  return <div>...</div>;
}
```

**Why Harmful**: Implicit contract, easy to forget, hard to test, no type safety.

**✅ Replacement**
```typescript
// Explicit prop drilling or layout slots
export default function SomePage() {
  return (
    <PageLayout
      title="Page"
      actions={<Button>Save</Button>}
    >
      <div>...</div>
    </PageLayout>
  );
}
```

### TODO
- [ ] Create `PageLayout` component with explicit props
- [ ] Migrate pages to use explicit header props

---

# SECTION 7 — Checklist for Future Development

## PR Checklist

### Before Creating PR
- [ ] File is in correct feature folder
- [ ] Types defined in feature's `types.ts`, not inline
- [ ] No cross-feature internal imports
- [ ] Hook follows `use-` naming convention
- [ ] Store has single responsibility
- [ ] Component < 300 lines (split if larger)
- [ ] No ReactNode in Zustand stores
- [ ] New route uses thin page component pattern

### During Code Review
- [ ] No `any` types
- [ ] Mutations use shared error handling
- [ ] Loading states handled
- [ ] Error states handled
- [ ] Consistent with existing patterns in feature
- [ ] Public exports updated in `index.ts`

---

## Architectural Guardrails

### Import Rules
```
✅ features/X → shared/*
✅ features/X → features/X/*
✅ app/* → features/*/index.ts
❌ features/X → features/Y/internal/*
❌ shared/* → features/*
❌ client → server (except types)
```

### State Location Decision
```
Q: Is this server data?
   YES → tRPC query, no store

Q: Is this used by one component?
   YES → useState

Q: Is this user preference that persists?
   YES → Zustand with persist

Q: Is this UI state shared across components in one feature?
   YES → Feature store

Q: Is this global app state?
   YES → Shared store
```

### Component Size Limits
```
UI Primitive: < 100 lines
Feature Component: < 300 lines
Page Component: < 50 lines (just composition)
Hook: < 100 lines
Store: < 50 lines (split if larger)
```

---

## "If You Need X, Do Y" Rules

| If you need... | Do this... |
|----------------|------------|
| A new tRPC endpoint | Add to existing router if related, create new router if new domain |
| A new form | Use local state, don't put form state in stores |
| Shared types between features | Move to `shared/types/` |
| A new UI primitive | Check shadcn first, add to `shared/components/ui/` |
| Feature-specific data fetching | Create hook in `features/X/hooks/` |
| Cross-feature data | Lift to shared store or pass via props |
| New user preference | Add to `global-settings-store`, use persist |
| Error handling | Use shared error boundary + toast pattern |
| Loading state | Use Suspense or skeleton from shared |

---

## Development Flow

```
1. Identify which feature the work belongs to
2. Check feature's index.ts for existing exports
3. Create new files in appropriate subfolder
4. Follow naming conventions
5. Export through index.ts
6. Update tests
7. Run linter for import violations
```

---

# Appendix: Migration Script Templates

## Script: Move File with Import Updates
```bash
#!/bin/bash
# Usage: ./move-file.sh old/path.tsx new/path.tsx

OLD_PATH=$1
NEW_PATH=$2
OLD_IMPORT=$(echo $OLD_PATH | sed 's|src/|~/|' | sed 's|\.tsx$||')
NEW_IMPORT=$(echo $NEW_PATH | sed 's|src/|~/|' | sed 's|\.tsx$||')

# Move file
mkdir -p $(dirname $NEW_PATH)
mv $OLD_PATH $NEW_PATH

# Update imports
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i "s|$OLD_IMPORT|$NEW_IMPORT|g"

echo "Moved $OLD_PATH → $NEW_PATH"
echo "Updated imports: $OLD_IMPORT → $NEW_IMPORT"
```

## Script: Create Feature Boilerplate
```bash
#!/bin/bash
# Usage: ./create-feature.sh feature-name

FEATURE=$1
BASE="src/features/$FEATURE"

mkdir -p $BASE/{components,hooks,stores,utils}
touch $BASE/types.ts
touch $BASE/constants.ts

cat > $BASE/index.ts << EOF
// Public exports for $FEATURE feature
export * from './types';
// export { ComponentName } from './components/component-name';
// export { useHookName } from './hooks/use-hook-name';
EOF

echo "Created feature: $FEATURE"
```

---

# Progress Tracking

## Overall Progress

| Phase | Status | Started | Completed |
|-------|--------|---------|-----------|
| Phase 1: Non-Breaking Cleanup | ✅ Completed | Jan 7, 2026 | Jan 7, 2026 |
| Phase 2: Structural Reorganization | ✅ Completed | Jan 7, 2026 | Jan 7, 2026 |
| Phase 3: Logic Extraction | 🟡 Mostly Complete | Jan 7, 2026 | - |
| Phase 4: Server Architecture | 🟡 Mostly Complete | Jan 7, 2026 | - |
| Phase 5: Final Hardening | 🟡 Partially Complete | Jan 7, 2026 | - |

## Feature Migration Progress

| Feature | Status | Components | Hooks | Stores | Types |
|---------|--------|------------|-------|--------|-------|
| auth | ✅ Completed | ✅ | ✅ | N/A | ✅ |
| connections | ✅ Completed | ✅ | ✅ | ✅ | ✅ |
| column-rules | ✅ Completed | ✅ | ✅ | ✅ | ✅ |
| table-explorer | ✅ Completed | ✅ | ✅ | ✅ | ✅ |
| saved-queries | ✅ Completed | ✅ | ✅ | ✅ | ✅ |
| settings | ✅ Completed | ✅ | ✅ | ✅ | ✅ |

## Remaining Items

### Phase 3 - Logic Extraction
- All items completed!

### Phase 4 - Server Architecture
- [x] Add input sanitization layer

### Phase 5 - Final Hardening
- [x] Write architectural documentation
- [x] Set up import linting rules (documented in ARCHITECTURE.md)
- [x] Create developer onboarding guide
- [x] Add feature README files

### Section 6 - Anti-Patterns
- [x] Split `advanced-table-viewer.tsx` into coordinator + views (God Component)
- [x] Extract toolbar, footer, and view components
- [x] Split `use-table-actions.ts` into 5 focused hooks
- [x] Create `PageLayout` component with explicit props (Magic Hooks)
- [ ] Migrate pages to use explicit header props

---

**End of Refactor Plan**

*This document should be treated as a living RFC. Update sections as implementation progresses and learnings emerge.*
