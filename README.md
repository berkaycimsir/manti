# Manti - Project Roadmap

## Project Overview
A modern web-based PostgreSQL Database Manager with user authentication, connection management, table visualization, SQL editing, and query history tracking.

**Tech Stack:**
- Frontend: Next.js (App Router)
- Backend: tRPC with Node.js
- Backend: tRPC integrated into Next.js (mounted on Next.js API routes / App Router handlers — no separate server)
- Database ORM: Drizzle ORM
- Authentication: Better-Auth
- UI Components: shadcn/ui + v0
- Styling: Tailwind CSS
- Database: PostgreSQL (for app data) + dynamic connections

---

## Phase 1: Project Setup & Infrastructure (Week 1-2)

### 1.1 Initialize Next.js Project
- [ ] Create Next.js 14+ project with App Router
- [ ] Configure TypeScript
- [ ] Set up Tailwind CSS
- [ ] Set up ESLint and Prettier

### 1.2 Database Setup
- [ ] Set up PostgreSQL for application data (users, connections, queries, history)
- [ ] Initialize Drizzle ORM
- [ ] Create initial database schema

### 1.3 Backend Architecture
- [ ] Set up tRPC with Next.js App Router
- [ ] Configure tRPC middleware (logging, error handling)
- [ ] Set up environment variables (.env.local)

Notes on integration
- The backend will run inside the Next.js server — do NOT create a separate Express/Fastify/standalone Node server.
- Use the official Next adapter (e.g. @trpc/next) or mount your tRPC router in an App Router route at `/app/api/trpc/route.ts` (or `/pages/api/trpc.ts` for Pages Router). This keeps all server code inside Next's process and deployment model.
- Design the tRPC context and handlers to be serverless-friendly if you plan to deploy to Vercel or other serverless platforms. Keep heavy long-lived connections (if any) managed via connection pooling and within appropriate lifecycle hooks.

### 1.4 Authentication Setup
- [ ] Implement Better-Auth
- [ ] Configure authentication providers (email/password)
- [ ] Set up session management
- [ ] Create authentication guards/middleware

---

## Phase 2: Authentication & User Management (Week 2-3)

### 2.1 Login/Signup Pages
- [ ] Design and build Signup page with form validation
- [ ] Design and build Login page with form validation
- [ ] Implement password reset flow
- [ ] Add email verification (optional)
- [ ] Create Protected routes/layout

### 2.2 User Profile
- [ ] Create user profile page
- [ ] Implement profile update functionality
- [ ] Add user settings page

### 2.3 Schema Design for Auth Data
```sql
-- Users table (managed by Better-Auth)
-- Sessions table (managed by Better-Auth)
-- Additional user preferences table if needed
```

---

## Phase 3: Database Connection Management (Week 3-4)

### 3.1 Connection Schema Design
**Database Schema:**
- [ ] Create `connections` table
  - id, userId, name, host, port, username, password (encrypted), database, url, createdAt, updatedAt
- [ ] Create `connection_metadata` table for caching connection info
- [ ] Implement encryption for sensitive credentials

### 3.2 Connection UI Components
- [ ] Create "Add New Connection" modal/page
- [ ] Build connection form with:
  - [ ] Connection name
  - [ ] Connection method toggle (URL vs Individual fields)
  - [ ] URL input field
  - [ ] Individual fields (host, port, username, password, database)
  - [ ] Test connection button
  - [ ] Save connection button
- [ ] Create connections list page
- [ ] Build connection card component with:
  - [ ] Connection details
  - [ ] Edit button
  - [ ] Delete button
  - [ ] Connect button

### 3.3 Backend tRPC Procedures
- [ ] `connection.create` - Create new connection
- [ ] `connection.update` - Update connection
- [ ] `connection.delete` - Delete connection
- [ ] `connection.list` - Get user's connections
- [ ] `connection.testConnection` - Test connection validity
- [ ] `connection.getById` - Get specific connection

### 3.4 Connection Encryption
- [ ] Implement credential encryption/decryption
- [ ] Set up secure credential storage

---

## Phase 4: Database Connection & Query Execution (Week 4-5)

### 4.1 Database Connection Handler
- [ ] Create database connection pool manager
- [ ] Implement connection caching
- [ ] Handle connection errors gracefully
- [ ] Create connection lifecycle management

### 4.2 Query Execution Engine
- [ ] Create query execution service
- [ ] Implement query timeout handling
- [ ] Add query result pagination
- [ ] Handle different data types properly

### 4.3 tRPC Procedures for Query Execution
- [ ] `database.query` - Execute raw SQL query
- [ ] `database.getTables` - Get list of tables
- [ ] `database.getTableSchema` - Get table structure
- [ ] `database.getTableData` - Get table data with pagination
- [ ] `database.getTableCount` - Get row count

---

## Phase 5: Table Management & Visualization (Week 5-7)

### 5.1 Table List Component
- [ ] Display tables from connected database
- [ ] Add search/filter functionality
- [ ] Implement table grouping by schema
- [ ] Add table icons and descriptions

### 5.2 Table Data Viewer
- [ ] Create main data grid component
- [ ] Implement pagination
- [ ] Add sorting functionality
- [ ] Add column filtering
- [ ] Implement column visibility toggle
- [ ] Add row selection

### 5.3 Multiple View Options
- [ ] **Grid View** - Traditional table view
- [ ] **Card View** - Card-based layout for records
- [ ] **JSON View** - JSON representation of data
- [ ] **Form View** - Individual record form
- [ ] **Chart/Analytics View** (optional)

### 5.4 Table Management Operations
- [ ] Create table
- [ ] Rename table
- [ ] Delete table (with confirmation)
- [ ] View table structure/schema
- [ ] Export table data (CSV, JSON)

### 5.5 Schema Design for Query History
- [ ] Create `saved_queries` table
  - id, userId, connectionId, title, query, createdAt, updatedAt
- [ ] Create `query_history` table
  - id, userId, connectionId, query, executedAt, executionTime, resultCount

---

## Phase 6: SQL Editor & Query Management (Week 7-8)

### 6.1 SQL Editor Component
- [ ] Integrate Monaco Editor or CodeMirror
- [ ] Add SQL syntax highlighting
- [ ] Implement query execution button
- [ ] Add query formatting (auto-format SQL)
- [ ] Implement keyboard shortcuts (Ctrl+Enter to execute)

### 6.2 Query Execution UI
- [ ] Display query results in formatted table
- [ ] Show execution time and row count
- [ ] Add download results button (CSV, JSON)
- [ ] Display query errors with helpful messages
- [ ] Add query cancel button for long-running queries

### 6.3 Query Saving
- [ ] Implement "Save Query" functionality
- [ ] Create saved queries management page
- [ ] Add query tags/categories
- [ ] Implement query search

### 6.4 Query History
- [ ] Track all executed queries
- [ ] Display query history with timestamps
- [ ] Add ability to re-run historical queries
- [ ] Implement history filtering and search
- [ ] Add history cleanup/export options

### 6.5 tRPC Procedures
- [ ] `query.execute` - Execute SQL query
- [ ] `query.save` - Save query
- [ ] `query.getSavedQueries` - List saved queries
- [ ] `query.deleteSavedQuery` - Delete saved query
- [ ] `query.getHistory` - Get execution history
- [ ] `query.clearHistory` - Clear history

---

## Phase 7: Row-Level Operations (Week 8-9)

### 7.1 Insert Operations
- [ ] Create "Insert New Row" modal/form
- [ ] Build dynamic form based on table schema
- [ ] Implement form validation
- [ ] Handle different data types (date, json, arrays, etc.)

### 7.2 Update Operations
- [ ] Implement inline editing in grid view
- [ ] Create edit modal for complex data
- [ ] Add change preview before commit
- [ ] Implement update validation

### 7.3 Delete Operations
- [ ] Add delete row functionality
- [ ] Implement confirmation dialog
- [ ] Add bulk delete capability
- [ ] Show affected rows count

### 7.4 tRPC Procedures
- [ ] `rows.insert` - Insert new row
- [ ] `rows.update` - Update existing row
- [ ] `rows.delete` - Delete row
- [ ] `rows.bulkInsert` - Bulk insert
- [ ] `rows.bulkDelete` - Bulk delete

---

## Phase 8: Advanced Features (Week 9-10)

### 8.1 Column Management
- [ ] Add new column
- [ ] Rename column
- [ ] Change column type
- [ ] Add/remove constraints (NOT NULL, UNIQUE, etc.)
- [ ] Create indexes

### 8.2 Data Export/Import
- [ ] Export table as CSV
- [ ] Export table as JSON
- [ ] Export query results
- [ ] Import CSV data into table

### 8.3 Database Statistics & Monitoring
- [ ] Display database size
- [ ] Show table sizes
- [ ] Display connection info
- [ ] Show active connections count
- [ ] Database health indicators

### 8.4 Advanced Querying
- [ ] Multi-table JOIN builder (visual query builder)
- [ ] Subquery support
- [ ] Aggregate functions visualization
- [ ] GROUP BY clause builder

### 8.5 tRPC Procedures
- [ ] `table.addColumn` - Add column
- [ ] `table.renameColumn` - Rename column
- [ ] `table.modifyColumn` - Modify column type
- [ ] `table.createIndex` - Create index
- [ ] `database.getStats` - Get database statistics

---

## Phase 9: Performance & Optimization (Week 10-11)

### 9.1 Frontend Optimization
- [ ] Implement virtual scrolling for large datasets
- [ ] Add request debouncing
- [ ] Optimize re-renders
- [ ] Implement lazy loading
- [ ] Add loading skeletons

### 9.2 Backend Optimization
- [ ] Implement connection pooling
- [ ] Add query result caching
- [ ] Optimize database queries
- [ ] Implement pagination limits

### 9.3 UI/UX Improvements
- [ ] Add dark mode support
- [ ] Implement responsive design
- [ ] Add keyboard navigation
- [ ] Improve error messages

---

## Phase 10: Testing & Deployment (Week 11-12)

### 10.1 Testing
- [ ] Set up testing framework (Jest, Vitest)
- [ ] Write unit tests for utilities
- [ ] Write integration tests for tRPC procedures
- [ ] Test authentication flows
- [ ] Test database operations

### 10.2 Security Review
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Rate limiting
- [ ] Input validation
- [ ] Credential encryption review

### 10.3 Deployment Setup
- [ ] Set up environment configurations
- [ ] Configure database migrations
- [ ] Set up CI/CD pipeline
- [ ] Deploy to hosting (Vercel, Railway, etc.)

---

## Database Schema Overview

```sql
-- Users & Auth (Better-Auth manages most)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  createdAt TIMESTAMP DEFAULT NOW()
);

-- Database Connections
CREATE TABLE connections (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  host TEXT,
  port INTEGER,
  username TEXT,
  password TEXT, -- encrypted
  database TEXT,
  connectionUrl TEXT,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);

-- Saved Queries
CREATE TABLE saved_queries (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES users(id),
  connectionId TEXT NOT NULL REFERENCES connections(id),
  title TEXT NOT NULL,
  query TEXT NOT NULL,
  tags TEXT[],
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);

-- Query History
CREATE TABLE query_history (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES users(id),
  connectionId TEXT NOT NULL REFERENCES connections(id),
  query TEXT NOT NULL,
  executedAt TIMESTAMP DEFAULT NOW(),
  executionTime INTEGER, -- ms
  resultCount INTEGER,
  error TEXT
);

-- Query Shortcuts (optional)
CREATE TABLE query_shortcuts (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES users(id),
  connectionId TEXT NOT NULL REFERENCES connections(id),
  key TEXT NOT NULL,
  query TEXT NOT NULL,
  UNIQUE(userId, key)
);
```

---

## File Structure

```
postgers-ui-manager/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   └── reset-password/
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   ├── connections/
│   │   │   ├── database/
│   │   │   │   ├── [connectionId]/
│   │   │   │   │   ├── tables/
│   │   │   │   │   ├── query-editor/
│   │   │   │   │   └── settings/
│   │   │   └── profile/
│   │   ├── api/
│   │   │   └── trpc/
│   │   │       └── [trpc]/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── auth/
│   │   ├── connections/
│   │   ├── database/
│   │   ├── table/
│   │   ├── editor/
│   │   ├── ui/ (shadcn components)
│   │   └── common/
│   ├── server/
│   │   ├── routers/
│   │   │   ├── auth.ts
│   │   │   ├── connection.ts
│   │   │   ├── database.ts
│   │   │   ├── query.ts
│   │   │   └── rows.ts
│   │   ├── db/
│   │   │   ├── schema.ts
│   │   │   ├── migrations/
│   │   │   └── index.ts
│   │   └── services/
│   │       ├── postgres-connection.ts
│   │       ├── query-executor.ts
│   │       └── encryption.ts
│   ├── lib/
│   │   ├── trpc.ts
│   │   ├── auth.ts
│   │   ├── utils.ts
│   │   └── constants.ts
│   └── types/
│       └── index.ts
├── .env.local
├── .env.example
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── package.json
└── README.md
```

---

## Key Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@trpc/client": "^10.44.0",
    "@trpc/server": "^10.44.0",
    "@trpc/next": "^10.44.0",
    "@trpc/react-query": "^10.44.0",
    "drizzle-orm": "^0.29.0",
    "drizzle-kit": "^0.20.0",
    "pg": "^8.11.0",
    "better-auth": "^1.0.0",
    "shadcn-ui": "latest",
    "@radix-ui/react-*": "latest",
    "tailwindcss": "^3.3.0",
    "clsx": "^2.0.0",
    "zod": "^3.22.0",
    "@tanstack/react-query": "^5.0.0",
    "monaco-editor": "^0.50.0",
    "date-fns": "^2.30.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "eslint": "^8.55.0",
    "prettier": "^3.1.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "tailwindcss": "^3.3.0"
  }
}
```

---

## Implementation Tips

### Security Best Practices
1. **Credential Storage**: Always encrypt database credentials before storing
2. **SQL Injection**: Use parameterized queries exclusively
3. **Rate Limiting**: Implement on tRPC procedures
4. **Authorization**: Always verify user owns connection before executing queries
5. **Input Validation**: Validate all inputs with Zod

### Performance Considerations
1. **Connection Pooling**: Use `pg` pool for efficient connection management
2. **Query Pagination**: Limit default rows (50-100)
3. **Caching**: Cache table schemas and statistics
4. **Virtual Scrolling**: For large datasets in grid view
5. **Debouncing**: Search, filter, and sort operations

### UX Enhancements
1. Add keyboard shortcuts for common operations
2. Implement undo/redo for edit operations
3. Add loading states and progress indicators
4. Implement breadcrumb navigation
5. Add tooltips and help text

---

## Timeline Summary
- **Week 1-2**: Setup & Infrastructure
- **Week 2-3**: Authentication
- **Week 3-4**: Connection Management
- **Week 4-5**: Database Query Execution
- **Week 5-7**: Table Visualization & Views
- **Week 7-8**: SQL Editor & Query Management
- **Week 8-9**: Row Operations
- **Week 9-10**: Advanced Features
- **Week 10-11**: Optimization
- **Week 11-12**: Testing & Deployment

**Estimated Total Duration**: 12 weeks for MVP with all core features

---

## Next Steps
1. Initialize the Next.js project
2. Set up the database schema
3. Configure Better-Auth
4. Create the project structure
5. Start with Phase 1 implementation
