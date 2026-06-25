import { Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/auth-context'
import { Skeleton } from '@/components/ui/skeleton'

type AuthGuardProps = {
  children: React.ReactNode
}

/**
 * Authenticated route guard.
 * Redirects anonymous users to login.
 * Shows skeleton during hydration.
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { status } = useAuth()

  if (status === 'loading') {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="size-10 rounded-full" />
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-3 w-48 rounded" />
        </div>
      </div>
    )
  }

  if (status === 'anonymous') {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
