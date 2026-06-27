import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'

import type { LoginResponse } from '@/types/api'
import { setAccessToken } from '@/lib/api-client'
import * as authApi from '@/lib/auth-api'
import { AuthContext, type AuthContextValue, type AuthState } from '@/features/auth/auth-session'

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    accessToken: null,
    user: null,
    status: 'loading', // Start loading — will attempt hydration
  })

  // Set session from login/refresh response
  const setSession = useCallback((response: LoginResponse) => {
    setAccessToken(response.accessToken)
    setState({
      accessToken: response.accessToken,
      user: response.user,
      status: 'authenticated',
    })
  }, [])

  // Clear session
  const clearSession = useCallback(() => {
    setAccessToken(null)
    setState({
      accessToken: null,
      user: null,
      status: 'anonymous',
    })
  }, [])

  // Login action
  const login = useCallback(
    (response: LoginResponse) => {
      setSession(response)
    },
    [setSession],
  )

  // Logout action — always clears local state even if backend fails
  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // Ignore backend failure — still clear local state
    } finally {
      clearSession()
    }
  }, [clearSession])

  // Hydrate current user (for reload persistence via refresh token cookie)
  const hydrateCurrentUser = useCallback(async () => {
    try {
      const response = await authApi.refreshToken()
      setSession(response)
    } catch {
      clearSession()
    }
  }, [setSession, clearSession])

  // Hydrate on mount
  useEffect(() => {
    hydrateCurrentUser()
  }, [hydrateCurrentUser])

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      logout,
      hydrateCurrentUser,
      clearSession,
    }),
    [state, login, logout, hydrateCurrentUser, clearSession],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
