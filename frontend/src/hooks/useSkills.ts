import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { skillsApi } from '../api/skills'
import type { SkillCreate } from '../types/skill'

export function useSkills(params?: { category?: string }) {
  return useQuery({
    queryKey: ['skills', params],
    queryFn: () => skillsApi.getAll(params).then(r => r.data),
  })
}

export function useCreateSkill() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: SkillCreate) => skillsApi.create(data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['skills'] }),
  })
}

export function useUpdateSkill() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<SkillCreate> }) =>
      skillsApi.update(id, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['skills'] }),
  })
}

export function useDeleteSkill() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => skillsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['skills'] }),
  })
}
