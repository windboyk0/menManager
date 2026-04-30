import client from './client'
import type { Employee, EmployeeCreate, EmployeeUpdate, EmployeeHistory } from '../types/employee'
import type { EmployeeSkill } from '../types/skill'

export const employeesApi = {
  getAll: (params?: { grade?: string; available_from?: string; available_to?: string; skill_ids?: number[] }) =>
    client.get<Employee[]>('/api/v1/employees/', { params }),
  getById: (id: string) =>
    client.get<Employee>(`/api/v1/employees/${id}/`),
  create: (data: EmployeeCreate) =>
    client.post<Employee>('/api/v1/employees/', data),
  update: (id: string, data: EmployeeUpdate) =>
    client.put<Employee>(`/api/v1/employees/${id}/`, data),
  delete: (id: string) =>
    client.delete(`/api/v1/employees/${id}/`),
  getHistory: (id: string) =>
    client.get<EmployeeHistory[]>(`/api/v1/employees/${id}/history/`),
  getSkills: (id: string) =>
    client.get<EmployeeSkill[]>(`/api/v1/employees/${id}/skills/`),
  addSkill: (id: string, data: { skill_id: number; proficiency: number }) =>
    client.post<EmployeeSkill>(`/api/v1/employees/${id}/skills/`, data),
  updateSkill: (id: string, skillId: number, data: { proficiency: number }) =>
    client.put<EmployeeSkill>(`/api/v1/employees/${id}/skills/${skillId}/`, data),
  deleteSkill: (id: string, skillId: number) =>
    client.delete(`/api/v1/employees/${id}/skills/${skillId}/`),
}
