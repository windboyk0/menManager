export interface Assignment {
  employee_id: string
  project_code: string
  input_month: string  // YYYY-MM
  input_manpower: number
}

export interface AssignmentCreate {
  employee_id: string
  project_code: string
  input_month: string  // YYYY-MM
  input_manpower: number
}

export interface AssignmentUpdate {
  input_manpower?: number
}

export interface AssignmentHistory {
  id: number
  changed_at: string
  employee_id: string
  project_code: string
  input_month: string
  event_type: 'INSERT' | 'UPDATE' | 'DELETE'
  old_values?: Record<string, string | null>
  new_values?: Record<string, string | null>
  changed_by: string
}
