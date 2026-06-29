import { Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/auth-session'

type AdminGuardProps = {
  children: React.ReactNode
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { user } = useAuth()

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/projects" replace />
  }

  return <>{children}</>
}
