import client from './client'
import type { Skill, SkillCreate } from '../types/skill'
import type { McpApiKey, McpUsageHistory } from '../types/skill'

export const skillsApi = {
  getAll: (params?: { category?: string }) =>
    client.get<Skill[]>('/api/v1/skills/', { params }),
  create: (data: SkillCreate) =>
    client.post<Skill>('/api/v1/skills/', data),
  update: (id: number, data: Partial<SkillCreate>) =>
    client.put<Skill>(`/api/v1/skills/${id}/`, data),
  delete: (id: number) =>
    client.delete(`/api/v1/skills/${id}/`),
}

export const mcpApi = {
  getApiKey: () =>
    client.get<McpApiKey>('/api/v1/mcp/apikey/'),
  createApiKey: () =>
    client.post<McpApiKey>('/api/v1/mcp/apikey/'),
  deleteApiKey: () =>
    client.delete('/api/v1/mcp/apikey/'),
  getHistory: () =>
    client.get<McpUsageHistory[]>('/api/v1/mcp/apikey/history/'),
}
