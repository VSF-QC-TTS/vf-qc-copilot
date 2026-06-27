import { Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/auth-session'

type GuestGuardProps = {
  children: React.ReactNode
}

/**
 * Guest-only route guard.
 * Redirects authenticated users to app home.
 */
export function GuestGuard({ children }: GuestGuardProps) {
  const { status } = useAuth()

  if (status === 'loading') {
    return null // Wait for hydration
  }

  if (status === 'authenticated') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
