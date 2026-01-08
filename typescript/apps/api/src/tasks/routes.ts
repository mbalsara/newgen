import { Hono } from 'hono'
import { taskService } from './service'
import type { NewTask, TaskStatus, TaskType } from '@repo/database'

const tasks = new Hono()

// GET /api/tasks - List all tasks with filters
tasks.get('/', async (c) => {
  try {
    const statusParam = c.req.query('status')
    const agent = c.req.query('agent')
    const type = c.req.query('type') as TaskType | 'all' | undefined
    const search = c.req.query('search')

    // Parse status filter (can be comma-separated)
    let statuses: TaskStatus[] | undefined
    if (statusParam) {
      statuses = statusParam.split(',') as TaskStatus[]
    }

    const tasks = await taskService.getTasks({
      statuses,
      agent: agent || 'all',
      type: type || 'all',
      search,
    })

    return c.json(tasks)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return c.json({ error: 'Failed to fetch tasks' }, 500)
  }
})

// GET /api/tasks/counts - Get task counts by status
tasks.get('/counts', async (c) => {
  try {
    const counts = await taskService.getStatusCounts()
    return c.json(counts)
  } catch (error) {
    console.error('Error fetching task counts:', error)
    return c.json({ error: 'Failed to fetch task counts' }, 500)
  }
})

// GET /api/tasks/:id - Get task by ID
tasks.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10)
    if (isNaN(id)) {
      return c.json({ error: 'Invalid task ID' }, 400)
    }

    const task = await taskService.getTaskById(id)
    if (!task) {
      return c.json({ error: 'Task not found' }, 404)
    }

    return c.json(task)
  } catch (error) {
    console.error('Error fetching task:', error)
    return c.json({ error: 'Failed to fetch task' }, 500)
  }
})

// POST /api/tasks - Create task
tasks.post('/', async (c) => {
  try {
    const body = await c.req.json<NewTask>()

    if (!body.patientId || !body.provider || !body.type || !body.description) {
      return c.json({
        error: 'Missing required fields: patientId, provider, type, description'
      }, 400)
    }

    const task = await taskService.createTask(body)
    return c.json(task, 201)
  } catch (error) {
    console.error('Error creating task:', error)
    return c.json({ error: 'Failed to create task' }, 500)
  }
})

// PATCH /api/tasks/:id - Update task
tasks.patch('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10)
    if (isNaN(id)) {
      return c.json({ error: 'Invalid task ID' }, 400)
    }

    const body = await c.req.json<Partial<NewTask>>()
    const task = await taskService.updateTask(id, body)

    if (!task) {
      return c.json({ error: 'Task not found' }, 404)
    }

    return c.json(task)
  } catch (error) {
    console.error('Error updating task:', error)
    return c.json({ error: 'Failed to update task' }, 500)
  }
})

// POST /api/tasks/:id/complete - Mark task as complete
tasks.post('/:id/complete', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10)
    if (isNaN(id)) {
      return c.json({ error: 'Invalid task ID' }, 400)
    }

    const body = await c.req.json<{ description?: string }>().catch(() => ({}))
    const task = await taskService.completeTask(id, body.description)

    if (!task) {
      return c.json({ error: 'Task not found' }, 404)
    }

    return c.json(task)
  } catch (error) {
    console.error('Error completing task:', error)
    return c.json({ error: 'Failed to complete task' }, 500)
  }
})

// POST /api/tasks/:id/escalate - Escalate task to staff
tasks.post('/:id/escalate', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10)
    if (isNaN(id)) {
      return c.json({ error: 'Invalid task ID' }, 400)
    }

    const body = await c.req.json<{ assignedTo: string; reason: string }>()

    if (!body.assignedTo || !body.reason) {
      return c.json({ error: 'Missing required fields: assignedTo, reason' }, 400)
    }

    const task = await taskService.escalateTask(id, body.assignedTo, body.reason)

    if (!task) {
      return c.json({ error: 'Task not found' }, 404)
    }

    return c.json(task)
  } catch (error) {
    console.error('Error escalating task:', error)
    return c.json({ error: 'Failed to escalate task' }, 500)
  }
})

// POST /api/tasks/:id/note - Add note to task
tasks.post('/:id/note', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10)
    if (isNaN(id)) {
      return c.json({ error: 'Invalid task ID' }, 400)
    }

    const body = await c.req.json<{ content: string }>()

    if (!body.content) {
      return c.json({ error: 'Missing required field: content' }, 400)
    }

    const task = await taskService.addNote(id, body.content)

    if (!task) {
      return c.json({ error: 'Task not found' }, 404)
    }

    return c.json(task)
  } catch (error) {
    console.error('Error adding note:', error)
    return c.json({ error: 'Failed to add note' }, 500)
  }
})

// POST /api/tasks/:id/read - Mark task as read
tasks.post('/:id/read', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10)
    if (isNaN(id)) {
      return c.json({ error: 'Invalid task ID' }, 400)
    }

    const task = await taskService.markAsRead(id)

    if (!task) {
      return c.json({ error: 'Task not found' }, 404)
    }

    return c.json(task)
  } catch (error) {
    console.error('Error marking task as read:', error)
    return c.json({ error: 'Failed to mark task as read' }, 500)
  }
})

// POST /api/tasks/:id/reassign - Reassign task to different agent
tasks.post('/:id/reassign', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10)
    if (isNaN(id)) {
      return c.json({ error: 'Invalid task ID' }, 400)
    }

    const body = await c.req.json<{ agentId: string; agentName: string }>()

    if (!body.agentId || !body.agentName) {
      return c.json({ error: 'Missing required fields: agentId, agentName' }, 400)
    }

    const task = await taskService.reassignTask(id, body.agentId, body.agentName)

    if (!task) {
      return c.json({ error: 'Task not found' }, 404)
    }

    return c.json(task)
  } catch (error) {
    console.error('Error reassigning task:', error)
    return c.json({ error: 'Failed to reassign task' }, 500)
  }
})

// DELETE /api/tasks/:id - Delete task
tasks.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10)
    if (isNaN(id)) {
      return c.json({ error: 'Invalid task ID' }, 400)
    }

    const deleted = await taskService.deleteTask(id)

    if (!deleted) {
      return c.json({ error: 'Task not found' }, 404)
    }

    return c.json({ success: true })
  } catch (error) {
    console.error('Error deleting task:', error)
    return c.json({ error: 'Failed to delete task' }, 500)
  }
})

export { tasks as taskRoutes }
