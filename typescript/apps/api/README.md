# API Server

Express API server with TypeScript, Drizzle ORM, and PostgreSQL.

## Features

- ✅ Express.js with TypeScript
- ✅ Drizzle ORM for database operations
- ✅ PostgreSQL database
- ✅ CORS enabled
- ✅ Error handling middleware
- ✅ Health check endpoints
- ✅ RESTful API routes

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm >= 8.0.0
- PostgreSQL database running

### Installation

From the monorepo root:

```bash
pnpm install
```

### Environment Setup

1. Copy the environment template:
```bash
cp apps/api/.env.example apps/api/.env
```

2. Update the `.env` file with your configuration:
```env
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/health_db
```

### Database Setup

The API uses the shared `@repo/database` package with Drizzle ORM.

1. **Push schema to database** (creates tables):
```bash
cd packages/database
pnpm db:push
```

Or generate and run migrations:
```bash
pnpm db:generate
pnpm db:migrate
```

2. **Verify connection**:
```bash
# Start the API server
pnpm --filter @repo/api dev

# Test database connection
curl http://localhost:3001/health/db
```

### Development

Run the API server in development mode with auto-reload:

```bash
pnpm --filter @repo/api dev
```

Or from the root:
```bash
pnpm dev  # Runs all apps including API
```

The API will be available at: `http://localhost:3001`

### Production Build

Build the API:

```bash
pnpm --filter @repo/api build
```

Start the production server:

```bash
pnpm --filter @repo/api start
```

## API Endpoints

### Health Checks

#### `GET /health`
Basic health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-11T04:00:00.000Z"
}
```

#### `GET /health/db`
Database connection health check.

**Success Response:**
```json
{
  "status": "ok",
  "database": "connected"
}
```

**Error Response:**
```json
{
  "status": "error",
  "database": "disconnected",
  "error": "Connection refused"
}
```

### Users API

#### `GET /api/users`
Get all users.

**Response:**
```json
{
  "users": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "email": "john@example.com",
      "emailVerified": true,
      "image": null,
      "createdAt": "2025-10-11T04:00:00.000Z",
      "updatedAt": "2025-10-11T04:00:00.000Z"
    }
  ]
}
```

#### `GET /api/users/:id`
Get user by ID.

**Response:**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john@example.com",
    "emailVerified": true,
    "image": null,
    "createdAt": "2025-10-11T04:00:00.000Z",
    "updatedAt": "2025-10-11T04:00:00.000Z"
  }
}
```

**Error Response (404):**
```json
{
  "error": "User not found"
}
```

#### `POST /api/users`
Create a new user.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john@example.com",
    "emailVerified": false,
    "image": null,
    "createdAt": "2025-10-11T04:00:00.000Z",
    "updatedAt": "2025-10-11T04:00:00.000Z"
  }
}
```

**Error Response (400):**
```json
{
  "error": "Name and email are required"
}
```

#### `PATCH /api/users/:id`
Update user by ID.

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```

**Response:**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "emailVerified": false,
    "image": null,
    "createdAt": "2025-10-11T04:00:00.000Z",
    "updatedAt": "2025-10-11T04:05:00.000Z"
  }
}
```

#### `DELETE /api/users/:id`
Delete user by ID.

**Response:**
```json
{
  "message": "User deleted successfully",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john@example.com",
    "emailVerified": false,
    "image": null,
    "createdAt": "2025-10-11T04:00:00.000Z",
    "updatedAt": "2025-10-11T04:00:00.000Z"
  }
}
```

## Database Integration

### Using Drizzle ORM

The API uses the shared `@repo/database` package which provides:

- Database connection (`db`)
- Schema definitions (`user`, `session`, `account`, etc.)
- Type-safe query builder

**Example: Query users**
```typescript
import { db, user } from '@repo/database'
import { eq } from 'drizzle-orm'

// Select all users
const users = await db.select().from(user)

// Select by ID
const userById = await db.select()
  .from(user)
  .where(eq(user.id, 'user-id'))

// Insert new user
const newUser = await db.insert(user)
  .values({
    id: crypto.randomUUID(),
    name: 'John Doe',
    email: 'john@example.com',
    emailVerified: false,
  })
  .returning()

// Update user
const updated = await db.update(user)
  .set({ name: 'Jane Doe' })
  .where(eq(user.id, 'user-id'))
  .returning()

// Delete user
await db.delete(user).where(eq(user.id, 'user-id'))
```

### Adding New Routes

1. Create a new route file in `src/routes/`:
```typescript
// src/routes/appointments.ts
import { Router } from 'express'
import { db } from '@repo/database'

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    // Your database logic here
    res.json({ data: [] })
  } catch (error) {
    next(error)
  }
})

export default router
```

2. Register the route in `src/index.ts`:
```typescript
import appointmentsRouter from './routes/appointments.js'

app.use('/api/appointments', appointmentsRouter)
```

## Error Handling

The API includes a global error handling middleware that:

- Logs errors to console
- Returns appropriate HTTP status codes
- Shows error messages in development mode
- Hides internal errors in production

**Example:**
```typescript
// Development mode
{
  "error": "Internal server error",
  "message": "Cannot read property 'id' of undefined"
}

// Production mode
{
  "error": "Internal server error"
}
```

## CORS Configuration

CORS is enabled for all origins by default. To restrict origins:

1. Update `.env`:
```env
CORS_ORIGIN=http://localhost:5174,https://yourapp.com
```

2. Update `src/index.ts`:
```typescript
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*'
}))
```

## Testing

Run tests:

```bash
pnpm --filter @repo/api test
```

## Linting

Lint code:

```bash
pnpm --filter @repo/api lint
```

## Project Structure

```
apps/api/
├── src/
│   ├── routes/              # API route handlers (HTTP layer)
│   │   └── users.ts         # Users routes
│   ├── services/            # Business logic layer
│   │   ├── user.service.ts      # User business logic
│   │   ├── appointment.service.ts  # Appointment logic (template)
│   │   ├── index.ts         # Service exports
│   │   └── README.md        # Services documentation
│   ├── index.ts             # Express app setup
│   └── index.test.ts        # Tests
├── .env.example             # Environment template
├── package.json
├── tsconfig.json
└── tsup.config.ts           # Build configuration
```

## Architecture Layers

```
┌─────────────────┐
│   HTTP Layer    │  ← routes/ (Express routers)
│   (Routes)      │     - Request validation
│                 │     - Response formatting
│                 │     - HTTP status codes
└────────┬────────┘
         │
┌────────▼────────┐
│  Business Layer │  ← services/ (Business logic)
│   (Services)    │     - Data validation
│                 │     - Business rules
│                 │     - Data transformations
└────────┬────────┘
         │
┌────────▼────────┐
│   Data Layer    │  ← @repo/database (Drizzle ORM)
│   (Database)    │     - Database queries
│                 │     - Schema definitions
└─────────────────┘
```

## Deployment

The API can be deployed to various platforms:

- **Docker**: Use the provided Dockerfile
- **Cloud Run**: Google Cloud Run
- **Heroku**: Node.js buildpack
- **Railway**: Automatic deployments
- **Fly.io**: Dockerfile-based deployment

### Docker Deployment

```bash
# Build image
docker build -t health-api -f apps/api/Dockerfile .

# Run container
docker run -p 3001:3001 \
  -e DATABASE_URL=postgresql://... \
  health-api
```

## Troubleshooting

### Database Connection Issues

**Error**: `Connection refused`

- Verify PostgreSQL is running
- Check DATABASE_URL is correct
- Ensure database exists
- Verify network connectivity

**Test connection**:
```bash
psql $DATABASE_URL -c "SELECT 1"
```

### Port Already in Use

**Error**: `EADDRINUSE: address already in use :::3001`

Change the port in `.env`:
```env
PORT=3002
```

### Module Not Found

**Error**: `Cannot find module '@repo/database'`

Build the database package:
```bash
pnpm --filter @repo/database build
```

## Contributing

When adding new endpoints:

1. Create route handlers in `src/routes/`
2. Use Drizzle ORM for database operations
3. Include error handling with `try/catch` and `next(error)`
4. Add TypeScript types for request/response
5. Document endpoints in this README
6. Write tests for new functionality

## Resources

- [Express.js Documentation](https://expressjs.com/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
