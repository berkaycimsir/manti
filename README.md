# Manti

A modern web-based PostgreSQL Database Manager built with Next.js, tRPC, and Drizzle ORM.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **API**: tRPC
- **Database**: PostgreSQL (Application Data)
- **ORM**: Drizzle ORM
- **UI**: shadcn/ui + Tailwind CSS
- **Auth**: Better-Auth

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL Database
- pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/manti.git
   cd manti
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   Copy `.env.example` to `.env` (create one if it doesn't exist) and fill in your database credentials.

4. Push the database schema:
   ```bash
   pnpm db:push
   ```

5. Run the development server:
   ```bash
   pnpm dev
   ```

## Development

We follow a Vertical Slice Architecture. Please read [ARCHITECTURE.md](./ARCHITECTURE.md) before contributing.

### Key Commands

- `pnpm dev`: Start dev server
- `pnpm build`: Build for production
- `pnpm lint`: Run linting
- `pnpm typecheck`: Run type checking

### Architecture Highlights

- **Features**: Located in `src/features/`. Each feature is self-contained.
- **Shared**: Common components and logic in `src/shared/`.
- **Server**: Business logic in `src/server/services/`, API definition in `src/server/api/`.

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for the original project plan and status.
