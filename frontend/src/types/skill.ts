export interface Skill {
  skill_id: number
  skill_name: string
  category: string
}

export interface SkillCreate {
  skill_name: string
  category: string
}

export interface EmployeeSkill {
  employee_id: string
  skill_id: number
  skill_name: string
  category: string
  proficiency: number
}

export interface McpApiKey {
  employee_id: string
  api_key: string
  created_at: string
  is_active: boolean
  last_used_at?: string
}

export interface McpUsageHistory {
  id: number
  used_at: string
  employee_id: string
  tool_name: string
  request_content: string
  response_status: string
}
