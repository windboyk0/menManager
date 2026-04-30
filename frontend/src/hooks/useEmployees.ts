import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { employeesApi } from '../api/employees'
import type { EmployeeCreate, EmployeeUpdate } from '../types/employee'

export function useEmployees(params?: { grade?: string; available_from?: string; available_to?: string; skill_ids?: number[] }) {
  return useQuery({
    queryKey: ['employees', params],
    queryFn: () => employeesApi.getAll(params).then(r => r.data),
  })
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: ['employees', id],
    queryFn: () => employeesApi.getById(id).then(r => r.data),
    enabled: !!id,
  })
}

export function useEmployeeHistory(id: string) {
  return useQuery({
    queryKey: ['employees', id, 'history'],
    queryFn: () => employeesApi.getHistory(id).then(r => r.data),
    enabled: !!id,
  })
}

export function useEmployeeSkills(id: string) {
  return useQuery({
    queryKey: ['employees', id, 'skills'],
    queryFn: () => employeesApi.getSkills(id).then(r => r.data),
    enabled: !!id,
  })
}

export function useCreateEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: EmployeeCreate) => employeesApi.create(data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  })
}

export function useUpdateEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EmployeeUpdate }) =>
      employeesApi.update(id, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  })
}

export function useDeleteEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => employeesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  })
}

export function useAddEmployeeSkill() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { skill_id: number; proficiency: number } }) =>
      employeesApi.addSkill(id, data).then(r => r.data),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ['employees', variables.id, 'skills'] }),
  })
}

export function useUpdateEmployeeSkill() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, skillId, data }: { id: string; skillId: number; data: { proficiency: number } }) =>
      employeesApi.updateSkill(id, skillId, data).then(r => r.data),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ['employees', variables.id, 'skills'] }),
  })
}

export function useDeleteEmployeeSkill() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, skillId }: { id: string; skillId: number }) =>
      employeesApi.deleteSkill(id, skillId),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ['employees', variables.id, 'skills'] }),
  })
}
