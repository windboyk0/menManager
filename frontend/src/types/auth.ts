export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  employee_id: string
  name: string
  career_years: number
  grade: '특급' | '고급' | '중급' | '초급'
  join_date: string
  position: string
  title: string
  username: string
  password: string
  role: '관리자' | '일반'
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface UserInfo {
  employee_id: string
  username: string
  role: '관리자' | '일반'
  exp: number
}
