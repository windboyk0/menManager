import client from './client'
import type { Project, ProjectCreate, ProjectUpdate, ProjectHistory } from '../types/project'

export const projectsApi = {
  getAll: (params?: { status?: string; client?: string }) =>
    client.get<Project[]>('/api/v1/projects/', { params }),
  getById: (code: string) =>
    client.get<Project>(`/api/v1/projects/${code}/`),
  create: (data: ProjectCreate) =>
    client.post<Project>('/api/v1/projects/', data),
  update: (code: string, data: ProjectUpdate) =>
    client.put<Project>(`/api/v1/projects/${code}/`, data),
  delete: (code: string) =>
    client.delete(`/api/v1/projects/${code}/`),
  getHistory: (code: string) =>
    client.get<ProjectHistory[]>(`/api/v1/projects/${code}/history/`),
}
