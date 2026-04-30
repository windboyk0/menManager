import { useCallback } from 'react'
import type { UserInfo, TokenResponse } from '../types/auth'

function parseJwt(token: string): UserInfo | null {
  try {
    const base64 = token.split('.')[1]
    const decoded = JSON.parse(atob(base64))
    return decoded as UserInfo
  } catch {
    return null
  }
}

export function useAuth() {
  const token = localStorage.getItem('access_token')
  const user = token ? parseJwt(token) : null

  const login = useCallback((data: TokenResponse) => {
    localStorage.setItem('access_token', data.access_token)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('access_token')
    window.location.href = '/login'
  }, [])

  const isAdmin = user?.role === '관리자'

  return { token, user, isAdmin, login, logout }
}
