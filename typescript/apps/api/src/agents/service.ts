import { agentRepository } from './repository'
import type { Agent, NewAgent } from '@repo/database'

export const agentService = {
  // Get all agents
  async getAllAgents(): Promise<Agent[]> {
    return agentRepository.findAll()
  },

  // Get AI agents only
  async getAIAgents(): Promise<Agent[]> {
    return agentRepository.findAIAgents()
  },

  // Get staff only
  async getStaff(): Promise<Agent[]> {
    return agentRepository.findStaff()
  },

  // Get agent by ID
  async getAgentById(id: string): Promise<Agent | undefined> {
    return agentRepository.findById(id)
  },

  // Get agent by VAPI assistant ID
  async getAgentByVapiId(vapiId: string): Promise<Agent | undefined> {
    return agentRepository.findByVapiAssistantId(vapiId)
  },

  // Create agent
  async createAgent(data: NewAgent): Promise<Agent> {
    return agentRepository.create(data)
  },

  // Update agent
  async updateAgent(id: string, data: Partial<NewAgent>): Promise<Agent | undefined> {
    return agentRepository.update(id, data)
  },

  // Delete agent
  async deleteAgent(id: string): Promise<boolean> {
    return agentRepository.delete(id)
  },

  // Get agents grouped by type
  async getAgentsGrouped(): Promise<{ ai: Agent[]; staff: Agent[] }> {
    const [ai, staff] = await Promise.all([
      agentRepository.findAIAgents(),
      agentRepository.findStaff(),
    ])
    return { ai, staff }
  },

  // Get VAPI assistant ID for an agent
  async getVapiAssistantId(agentId: string): Promise<string | undefined> {
    const agent = await agentRepository.findById(agentId)
    return agent?.vapiAssistantId ?? undefined
  },
}
