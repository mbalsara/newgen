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
