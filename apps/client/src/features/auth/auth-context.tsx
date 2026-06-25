import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  use,
} from 'react'
import type { LoginResponse, UserResponse } from '@/types/api'
import { setAccessToken } from '@/lib/api-client'
import * as authApi from '@/lib/auth-api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AuthStatus = 'anonymous' | 'loading' | 'authenticated'

type AuthState = {
  accessToken: string | null
  user: UserResponse | null
  status: AuthStatus
}

type AuthActions = {
  login: (response: LoginResponse) => void
  logout: () => Promise<void>
  hydrateCurrentUser: () => Promise<void>
  clearSession: () => void
}

type AuthContextValue = AuthState & AuthActions

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextValue | null>(null)

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: React.ReactNode }) {
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

// ---------------------------------------------------------------------------
// Hook — uses React 19 use()
// ---------------------------------------------------------------------------

export function useAuth(): AuthContextValue {
  const context = use(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
