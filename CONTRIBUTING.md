# Contributing to Manti

Welcome to the Manti codebase! This guide will help you get set up and contributing quickly.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Code Guidelines](#code-guidelines)
5. [Making Changes](#making-changes)
6. [Testing](#testing)
7. [Submitting Changes](#submitting-changes)

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ (LTS recommended)
- **pnpm** (or npm/yarn, but pnpm is preferred)
- **Docker** (for local PostgreSQL)
- **Git**

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/manti.git
cd manti
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Update the following variables:
- `DATABASE_URL` - Your PostgreSQL connection string
- `BETTER_AUTH_SECRET` - A random secret for authentication
- `BETTER_AUTH_URL` - Your app URL (default: `http://localhost:3000`)

### 4. Start the Database

You can use Docker to start a local PostgreSQL instance:

```bash
./start-database.sh
```

Or use your own PostgreSQL server.

### 5. Run Migrations

```bash
pnpm db:migrate
```

### 6. Start the Development Server

```bash
pnpm dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

---

## Development Workflow

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run Biome linter |
| `pnpm format` | Format code with Biome |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm db:generate` | Generate new migration |
| `pnpm db:migrate` | Run pending migrations |
| `pnpm db:push` | Push schema changes (dev only) |
| `pnpm db:studio` | Open Drizzle Studio |

### Editor Setup

We recommend using **VS Code** with the following extensions:

- **Biome** - For linting and formatting
- **Tailwind CSS IntelliSense** - For Tailwind class autocomplete
- **TypeScript Importer** - For auto-imports

Add to your VS Code settings:
```json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports.biome": "explicit"
  }
}
```

---

## Code Guidelines

### Import Path Aliases

Always use path aliases instead of relative paths:

```typescript
// ✅ Good
import { Button } from "@shared/components/ui/button";
import { useConnections } from "@features/connections";

// ❌ Bad
import { Button } from "../../../shared/components/ui/button";
```

### Import Boundaries

Follow these import rules to maintain architecture:

| From | Can Import From |
|------|-----------------|
| `app/*` | `@features/*/index.ts`, `@shared/*` |
| `features/*` | `@shared/*`, internal feature code |
| `shared/*` | `@shared/*` only |
| `server/*` | `@server/*` only |

**Never:**
- Import from one feature's internals into another feature
- Import from `features/` into `shared/`
- Import server code into client code (except types)

### Component Guidelines

1. **Keep components focused** - Under 300 lines
2. **Use composition** - Prefer smaller components combined together
3. **Extract hooks** - Complex logic should live in hooks
4. **Type your props** - Always define prop interfaces

```tsx
interface CardProps {
  title: string;
  children: React.ReactNode;
}

export function Card({ title, children }: CardProps) {
  return (
    <div className="rounded-lg border p-4">
      <h2 className="font-semibold">{title}</h2>
      {children}
    </div>
  );
}
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ConnectionCard` |
| Files | kebab-case | `connection-card.tsx` |
| Hooks | camelCase with `use` prefix | `useConnections` |
| Stores | kebab-case with `-store` suffix | `table-view-store.ts` |
| Types | PascalCase | `ConnectionConfig` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_CONNECTIONS` |

---

## Making Changes

### Adding a New Feature

1. Create the feature folder:
   ```
   src/features/my-feature/
   ├── components/
   ├── hooks/
   ├── stores/
   ├── types.ts
   ├── index.ts
   └── README.md
   ```

2. Document in `README.md`:
   - Purpose of the feature
   - Components it exports
   - How to use it

3. Export public API via `index.ts`

### Adding a New Component

1. Decide location:
   - Generic/reusable → `@shared/components/`
   - Feature-specific → `@features/{name}/components/`

2. Create the component file
3. Add to exports if needed

### Adding a New API Endpoint

1. Add to appropriate router in `src/server/api/routers/`
2. Implement business logic in corresponding service
3. Use Zod schemas for validation
4. Test the endpoint

---

## Testing

### Type Checking

Before committing, always run:

```bash
pnpm typecheck
```

### Linting

```bash
pnpm lint
```

Fix issues automatically:

```bash
pnpm format
```

### Manual Testing

1. Test your changes in the browser
2. Check for console errors
3. Verify mobile responsiveness
4. Test with different themes

---

## Submitting Changes

### Commit Messages

Use conventional commits:

```
feat: add connection import feature
fix: correct table sorting for dates
docs: update README with new setup steps
refactor: extract table row component
style: format connection list
```

### Pull Request Process

1. Create a feature branch:
   ```bash
   git checkout -b feat/my-feature
   ```

2. Make your changes

3. Run checks:
   ```bash
   pnpm typecheck && pnpm lint
   ```

4. Push and create a PR:
   ```bash
   git push origin feat/my-feature
   ```

5. Fill out the PR template

6. Wait for review

### PR Checklist

- [ ] Code follows the style guidelines
- [ ] TypeScript compiles without errors
- [ ] Biome linting passes
- [ ] Tested in browser
- [ ] Documentation updated (if needed)
- [ ] No console.log statements left

---

## Getting Help

- Check [ARCHITECTURE.md](./ARCHITECTURE.md) for project structure
- Look at existing code for patterns
- Ask in team chat for guidance

Happy coding! 🚀
