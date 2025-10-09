# Monorepo

Full-stack TypeScript monorepo with React, Express, and PostgreSQL.

## Structure

```
├── apps/
│   ├── api/          # Express API server
│   └── web/          # Vite + React physician office application
├── packages/
│   ├── database/     # Drizzle ORM & schema
│   └── types/        # Shared TypeScript types
└── docker-compose.yml
```

## Tech Stack

- **Frontend**: Vite, React 18, Tailwind CSS, Shadcn UI, TanStack Table
- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL, Drizzle ORM
- **AI**: Vercel AI SDK
- **Build**: Turbo (monorepo), tsup, pnpm
- **Testing**: Vitest
- **Linting**: ESLint, Prettier
- **Infrastructure**: Docker, Docker Compose

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm >= 8.0.0
- Docker & Docker Compose (optional)

### Install Dependencies

```bash
pnpm install
```

### Environment Variables

1. Copy `.env.example` to `.env` in `apps/api/`:
```bash
cp apps/api/.env.example apps/api/.env
```

2. Update `DATABASE_URL` in `apps/api/.env`

### Development

Run all apps in development mode:

```bash
pnpm dev
```

Or run individual apps:

```bash
# API only
pnpm --filter @repo/api dev

# Web only
pnpm --filter @repo/web dev
```

### Docker

Start all services with Docker:

```bash
docker-compose up
```

Services:
- Web: http://localhost:3000
- API: http://localhost:3001
- PostgreSQL: localhost:5432

### Database

Generate migrations:

```bash
pnpm --filter @repo/database db:generate
```

Run migrations:

```bash
pnpm --filter @repo/database db:migrate
```

Open Drizzle Studio:

```bash
pnpm --filter @repo/database db:studio
```

### Build

Build all packages and apps:

```bash
pnpm build
```

### Testing

Run all tests:

```bash
pnpm test
```

### Linting

Lint all code:

```bash
pnpm lint
```

Format code:

```bash
pnpm format
```

## Scripts

- `pnpm dev` - Start all apps in development
- `pnpm build` - Build all apps and packages with Turbo
- `pnpm test` - Run all tests with Vitest
- `pnpm lint` - Lint all apps and packages with ESLint
- `pnpm clean` - Clean build artifacts
- `pnpm format` - Format code with Prettier

## Workspaces

- `@repo/api` - Express API (built with tsup)
- `@repo/web` - Vite + React physician office application
- `@repo/database` - Database layer (built with tsup)
- `@repo/types` - Shared types (built with tsup)
