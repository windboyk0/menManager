import client from './client'
import type { Assignment, AssignmentCreate, AssignmentUpdate, AssignmentHistory } from '../types/assignment'

export const assignmentsApi = {
  getAll: (params?: { employee_id?: string; project_code?: string }) =>
    client.get<Assignment[]>('/api/v1/assignments/', { params }),
  getByEmpProj: (empId: string, projCode: string) =>
    client.get<Assignment[]>(`/api/v1/assignments/${empId}/${projCode}/`),
  create: (data: AssignmentCreate) =>
    client.post<Assignment>('/api/v1/assignments/', data),
  updateMonth: (empId: string, projCode: string, month: string, data: AssignmentUpdate) =>
    client.put<Assignment>(`/api/v1/assignments/${empId}/${projCode}/${month}/`, data),
  delete: (empId: string, projCode: string) =>
    client.delete(`/api/v1/assignments/${empId}/${projCode}/`),
  getHistory: (empId: string, projCode: string) =>
    client.get<AssignmentHistory[]>(`/api/v1/assignments/${empId}/${projCode}/history/`),
}
