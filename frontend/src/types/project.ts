export interface Project {
  project_code: string
  client: string
  project_name: string
  start_date: string
  end_date: string
  status: '진행중' | '완료' | '대기' | '취소'
  inspection_date?: string
  total_manpower: number
  contract_amount: number
  senior_manpower: number
  advanced_manpower: number
  intermediate_manpower: number
  junior_manpower: number
}

export interface ProjectCreate extends Omit<Project, 'inspection_date'> {
  inspection_date?: string
}

export interface ProjectUpdate {
  client?: string
  project_name?: string
  start_date?: string
  end_date?: string
  status?: '진행중' | '완료' | '대기' | '취소'
  inspection_date?: string
  total_manpower?: number
  contract_amount?: number
  senior_manpower?: number
  advanced_manpower?: number
  intermediate_manpower?: number
  junior_manpower?: number
}

export interface ProjectHistory {
  id: number
  changed_at: string
  project_code: string
  event_type: 'INSERT' | 'UPDATE' | 'DELETE'
  old_values?: Record<string, string | null>
  new_values?: Record<string, string | null>
  changed_by: string
}
