export interface Employee {
  employee_id: string
  name: string
  career_years: number
  grade: '특급' | '고급' | '중급' | '초급'
  join_date: string
  position: string
  title: string
}

export interface EmployeeCreate extends Employee {}

export interface EmployeeUpdate {
  name?: string
  career_years?: number
  grade?: '특급' | '고급' | '중급' | '초급'
  join_date?: string
  position?: string
  title?: string
}

export interface EmployeeHistory {
  id: number
  changed_at: string
  employee_id: string
  event_type: 'INSERT' | 'UPDATE' | 'DELETE'
  old_values?: Record<string, string | null>
  new_values?: Record<string, string | null>
  changed_by: string
}
