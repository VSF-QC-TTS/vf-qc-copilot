import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { GuestGuard } from '@/features/auth/guards/GuestGuard'
import { AuthGuard } from '@/features/auth/guards/AuthGuard'
import { Skeleton } from '@/components/ui/skeleton'

// Lazy-loaded auth pages — code-split per route
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage').then(m => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage').then(m => ({ default: m.RegisterPage })))
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('@/features/auth/pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })))
const VerifyEmailPage = lazy(() => import('@/features/auth/pages/VerifyEmailPage').then(m => ({ default: m.VerifyEmailPage })))

// Placeholder for authenticated app
function DashboardPlaceholder() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Vinfast QC Copilot
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Authenticated. Dashboard coming soon.
        </p>
      </div>
    </div>
  )
}

// Route-level loading fallback — skeleton
function RouteFallback() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background">
      <div className="w-full max-w-[420px] px-4">
        <div className="mb-8 flex justify-center">
          <Skeleton className="h-7 w-36 rounded" />
        </div>
        <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-5 w-24 rounded" />
            <Skeleton className="h-3 w-48 rounded" />
            <Skeleton className="mt-2 h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* Guest-only auth routes */}
        <Route path="/login" element={<GuestGuard><LoginPage /></GuestGuard>} />
        <Route path="/register" element={<GuestGuard><RegisterPage /></GuestGuard>} />
        <Route path="/forgot-password" element={<GuestGuard><ForgotPasswordPage /></GuestGuard>} />
        <Route path="/reset-password" element={<GuestGuard><ResetPasswordPage /></GuestGuard>} />
        <Route path="/verify-email" element={<GuestGuard><VerifyEmailPage /></GuestGuard>} />

        {/* Protected routes */}
        <Route path="/" element={<AuthGuard><DashboardPlaceholder /></AuthGuard>} />
        <Route path="*" element={<AuthGuard><DashboardPlaceholder /></AuthGuard>} />
      </Routes>
    </Suspense>
  )
}

export default App
