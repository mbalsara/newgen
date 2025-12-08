import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import dotenv from 'dotenv'
import { createYoga } from 'graphql-yoga'
import { schema } from './graphql/schema.js'

dotenv.config()

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

  // Return the VAPI response
  const data = await response.json()
  return c.json(data, response.status as 200)
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
