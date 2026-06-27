import { createContext, use } from 'react'

import type { LoginResponse, UserResponse } from '@/types/api'

export type AuthStatus = 'anonymous' | 'loading' | 'authenticated'

export type AuthState = {
  accessToken: string | null
  user: UserResponse | null
  status: AuthStatus
}

export type AuthActions = {
  login: (response: LoginResponse) => void
  logout: () => Promise<void>
  hydrateCurrentUser: () => Promise<void>
  clearSession: () => void
}

export type AuthContextValue = AuthState & AuthActions

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const context = use(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
