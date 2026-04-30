import client from './client'
import type { LoginRequest, RegisterRequest, TokenResponse } from '../types/auth'

export const authApi = {
  login: (data: LoginRequest) =>
    client.post<TokenResponse>('/api/v1/auth/login/', data),
  register: (data: RegisterRequest) =>
    client.post('/api/v1/auth/register/', data),
  changePassword: (employeeId: string, data: { current_password: string; new_password: string }) =>
    client.put(`/api/v1/auth/update/${employeeId}/updatePW/`, data),
}
