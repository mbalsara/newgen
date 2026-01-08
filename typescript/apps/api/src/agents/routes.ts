import { Hono } from 'hono'
import { agentService } from './service'
import type { NewAgent } from '@repo/database'

const agents = new Hono()

// GET /api/agents - List all agents
agents.get('/', async (c) => {
  try {
    const agents = await agentService.getAllAgents()
    return c.json(agents)
  } catch (error) {
    console.error('Error fetching agents:', error)
    return c.json({ error: 'Failed to fetch agents' }, 500)
  }
})

// GET /api/agents/grouped - Get agents grouped by type
agents.get('/grouped', async (c) => {
  try {
    const grouped = await agentService.getAgentsGrouped()
    return c.json(grouped)
  } catch (error) {
    console.error('Error fetching grouped agents:', error)
    return c.json({ error: 'Failed to fetch agents' }, 500)
  }
})

// GET /api/agents/ai - Get AI agents only
agents.get('/ai', async (c) => {
  try {
    const aiAgents = await agentService.getAIAgents()
    return c.json(aiAgents)
  } catch (error) {
    console.error('Error fetching AI agents:', error)
    return c.json({ error: 'Failed to fetch AI agents' }, 500)
  }
})

// GET /api/agents/staff - Get staff only
agents.get('/staff', async (c) => {
  try {
    const staff = await agentService.getStaff()
    return c.json(staff)
  } catch (error) {
    console.error('Error fetching staff:', error)
    return c.json({ error: 'Failed to fetch staff' }, 500)
  }
})

// GET /api/agents/:id - Get agent by ID
agents.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const agent = await agentService.getAgentById(id)
    if (!agent) {
      return c.json({ error: 'Agent not found' }, 404)
    }
    return c.json(agent)
  } catch (error) {
    console.error('Error fetching agent:', error)
    return c.json({ error: 'Failed to fetch agent' }, 500)
  }
})

// POST /api/agents - Create agent
agents.post('/', async (c) => {
  try {
    const body = await c.req.json<NewAgent>()
    if (!body.id || !body.name || !body.type || !body.role) {
      return c.json({ error: 'Missing required fields: id, name, type, role' }, 400)
    }
    const agent = await agentService.createAgent(body)
    return c.json(agent, 201)
  } catch (error) {
    console.error('Error creating agent:', error)
    return c.json({ error: 'Failed to create agent' }, 500)
  }
})

// PATCH /api/agents/:id - Update agent
agents.patch('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json<Partial<NewAgent>>()
    const agent = await agentService.updateAgent(id, body)
    if (!agent) {
      return c.json({ error: 'Agent not found' }, 404)
    }
    return c.json(agent)
  } catch (error) {
    console.error('Error updating agent:', error)
    return c.json({ error: 'Failed to update agent' }, 500)
  }
})

// DELETE /api/agents/:id - Delete agent
agents.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const deleted = await agentService.deleteAgent(id)
    if (!deleted) {
      return c.json({ error: 'Agent not found' }, 404)
    }
    return c.json({ success: true })
  } catch (error) {
    console.error('Error deleting agent:', error)
    return c.json({ error: 'Failed to delete agent' }, 500)
  }
})

export { agents as agentRoutes }
