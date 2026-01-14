// Load environment variables BEFORE other imports
// Load .env first, then .env.local (local overrides base)
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const apiRoot = resolve(__dirname, '..')

console.log('[ENV] Loading from:', resolve(apiRoot, '.env.local'))
config({ path: resolve(apiRoot, '.env') })
config({ path: resolve(apiRoot, '.env.local'), override: true })
console.log('[ENV] VAPI_API_KEY:', process.env.VAPI_API_KEY ? 'SET' : 'NOT SET')

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { createYoga } from 'graphql-yoga'
import { schema } from './graphql/schema.js'
import { agentRoutes } from './agents/routes.js'
import { taskRoutes } from './tasks/routes.js'
import { callRoutes } from './calls/routes.js'

const app = new Hono()

// Middleware
app.use('*', logger())
app.use('*', cors())

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
})

// =============================================================================
// REST API Routes
// =============================================================================

// Mount REST API routes
app.route('/api/agents', agentRoutes)
app.route('/api/tasks', taskRoutes)
app.route('/api/calls', callRoutes)

// =============================================================================
// VAPI Proxy Routes
// Proxies requests to VAPI API to avoid CORS issues in the browser
// =============================================================================

const VAPI_API_KEY = process.env.VAPI_API_KEY || ''
const VAPI_BASE_URL = 'https://api.vapi.ai'

// Proxy all VAPI API requests
app.all('/api/vapi/*', async (c) => {
  if (!VAPI_API_KEY) {
    return c.json({ error: 'VAPI_API_KEY not configured' }, 500)
  }

  // Get the path after /api/vapi
  const vapiPath = c.req.path.replace('/api/vapi', '')
  const url = `${VAPI_BASE_URL}${vapiPath}`

  // Forward the request to VAPI
  const response = await fetch(url, {
    method: c.req.method,
    headers: {
      'Authorization': `Bearer ${VAPI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: c.req.method !== 'GET' && c.req.method !== 'HEAD'
      ? await c.req.text()
      : undefined,
  })

  // Handle empty responses (e.g., DELETE, some POST endpoints)
  const text = await response.text()
  if (!text) {
    return c.json({ success: true }, response.status as 200)
  }

  // Return the VAPI response as JSON
  try {
    const data = JSON.parse(text)
    return c.json(data, response.status as 200)
  } catch {
    // If not valid JSON, return as message
    return c.json({ message: text }, response.status as 200)
  }
})

// GraphQL endpoint
const yoga = createYoga({
  schema,
  graphqlEndpoint: '/graphql',
  landingPage: true,
})

app.use('/graphql', async (c) => {
  const response = await yoga.fetch(c.req.raw, {
    // Pass Hono context if needed
  })
  return response
})

const port = Number(process.env.PORT) || 3001

// For Bun or Cloudflare Workers, export the app
export default {
  port,
  fetch: app.fetch,
}

// For Node.js, use serve
import { serve } from '@hono/node-server'

serve({
  fetch: app.fetch,
  port,
})

console.log(`🚀 Server running on port ${port}`)
console.log(`📊 GraphQL endpoint: http://localhost:${port}/graphql`)
