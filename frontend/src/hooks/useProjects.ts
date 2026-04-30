import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectsApi } from '../api/projects'
import type { ProjectCreate, ProjectUpdate } from '../types/project'

export function useProjects(params?: { status?: string; client?: string }) {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: () => projectsApi.getAll(params).then(r => r.data),
  })
}

export function useProject(code: string) {
  return useQuery({
    queryKey: ['projects', code],
    queryFn: () => projectsApi.getById(code).then(r => r.data),
    enabled: !!code,
  })
}

export function useProjectHistory(code: string) {
  return useQuery({
    queryKey: ['projects', code, 'history'],
    queryFn: () => projectsApi.getHistory(code).then(r => r.data),
    enabled: !!code,
  })
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ProjectCreate) => projectsApi.create(data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })
}

export function useUpdateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ code, data }: { code: string; data: ProjectUpdate }) =>
      projectsApi.update(code, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })
}

export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (code: string) => projectsApi.delete(code),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })
}
