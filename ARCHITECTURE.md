# Manti Architecture Guide

## Overview

Manti follows a feature-based architecture pattern called "Vertical Slice Architecture" adapted for Next.js.
The goal is to colocate related code (components, hooks, stores) within feature folders, while keeping shared utilities and UI primitives in a common shared layer.

## Project Structure

```
src/
├── app/                              # Next.js App Router (routing only)
│   ├── layout.tsx
│   ├── page.tsx
│   ├── (auth)/
│   ├── (dashboard)/
│   └── api/
│
├── features/                         # Feature Modules (Vertical Slices)
│   ├── auth/
│   ├── connections/
│   ├── table-explorer/
│   ├── saved-queries/
│   ├── settings/
│   └── column-rules/
│
├── shared/                           # Shared Horizontal Layer
│   ├── components/
│   │   ├── ui/                       # Reusable UI primitives (shadcn/ui)
│   │   ├── layout/                   # App shell, sidebar, header
│   │   └── common/                   # Generic business-agnostic components
│   │
│   ├── hooks/                        # Shared hooks (use-debounce, etc.)
│   ├── lib/                          # Shared utilities (cn, date formatting)
│   └── stores/                       # Global stores (theme, layout)
│
├── server/                           # Server-side Logic (tRPC)
│   ├── api/
│   │   ├── routers/                  # API Routers (Validation & Auth)
│   │   └── trpc.ts                   # tRPC Initialization
│   └── services/                     # Business Logic Layer
│       ├── connection-service.ts
│       ├── table-service.ts
│       └── ...
```

## Architectural Rules

### 1. Import Boundaries

We enforce strict import boundaries to prevent coupling:

- **Features** can import from `@shared/*`.
- **Features** can import from `@server/*` (types only).
- **Features** CANNOT import detailed internals of other features.
- **Shared** CANNOT import from `features`.
- **Server** CANNOT import from `client` code (features/shared).

### 2. State Management

- **URL State**: For shareable state (filters, sort, pagination).
- **React State**: For local component interactions.
- **Zustand**: For complex client-local state (global settings, layout).
- **tRPC (React Query)**: For all server data.

### 3. Server Architecture

We use a Service-Repository pattern:

- **Routers**: Handle request validation, auth checks, and call Services.
- **Services**: Contain all business logic, database transactions, and data transformation.
- **Database**: Direct access via Drizzle ORM within Services only.

## Development Guidelines

- **New Features**: Create a new folder in `src/features/`.
- **New UI Component**: If generic, `src/shared/components`. If specific, `src/features/X/components`.
- **New API Endpoint**: Add to `src/server/api/routers` and delegate logic to `src/server/services`.

## Path Aliases

- `~/*` -> `./src/*`
- `@features/*` -> `./src/features/*`
- `@shared/*` -> `./src/shared/*`
- `@server/*` -> `./src/server/*`
