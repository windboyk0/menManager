import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { assignmentsApi } from '../api/assignments'
import type { AssignmentCreate, AssignmentUpdate } from '../types/assignment'

export function useAssignments(params?: { employee_id?: string; project_code?: string }) {
  return useQuery({
    queryKey: ['assignments', params],
    queryFn: () => assignmentsApi.getAll(params).then(r => r.data),
  })
}

export function useAssignmentMonths(empId: string, projCode: string) {
  return useQuery({
    queryKey: ['assignments', empId, projCode],
    queryFn: () => assignmentsApi.getByEmpProj(empId, projCode).then(r => r.data),
    enabled: !!empId && !!projCode,
  })
}

export function useAssignmentHistory(empId: string, projCode: string) {
  return useQuery({
    queryKey: ['assignments', empId, projCode, 'history'],
    queryFn: () => assignmentsApi.getHistory(empId, projCode).then(r => r.data),
    enabled: !!empId && !!projCode,
  })
}

export function useCreateAssignment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: AssignmentCreate) => assignmentsApi.create(data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assignments'] }),
  })
}

export function useUpdateAssignmentMonth() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ empId, projCode, month, data }: { empId: string; projCode: string; month: string; data: AssignmentUpdate }) =>
      assignmentsApi.updateMonth(empId, projCode, month, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assignments'] }),
  })
}

export function useDeleteAssignment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ empId, projCode }: { empId: string; projCode: string }) =>
      assignmentsApi.delete(empId, projCode),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assignments'] }),
  })
}
