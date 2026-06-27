import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { GuestGuard } from '@/features/auth/guards/GuestGuard'
import { AuthGuard } from '@/features/auth/guards/AuthGuard'
import { AuthLayout } from '@/features/auth/layouts/AuthLayout'
import { Skeleton } from '@/components/ui/skeleton'
import { AppLayout } from '@/features/dashboard/layouts/AppLayout'
import { ProjectLayout } from '@/features/dashboard/layouts/ProjectLayout'

// Lazy-loaded auth pages — code-split per route
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage').then(m => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage').then(m => ({ default: m.RegisterPage })))
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('@/features/auth/pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })))
const VerifyEmailPage = lazy(() => import('@/features/auth/pages/VerifyEmailPage').then(m => ({ default: m.VerifyEmailPage })))

const ProjectListPage = lazy(() => import('@/features/project/pages/ProjectListPage').then(m => ({ default: m.ProjectListPage })))
const ProjectOverviewPage = lazy(() => import('@/features/project/pages/ProjectOverviewPage').then(m => ({ default: m.ProjectOverviewPage })))
const PlaceholderPage = lazy(() => import('@/features/project/pages/PlaceholderPage').then(m => ({ default: m.PlaceholderPage })))

const TargetConfigPage = lazy(() => import('@/features/project/pages/config/TargetConfigPage').then(m => ({ default: m.TargetConfigPage })))
const AiConfigPage = lazy(() => import('@/features/project/pages/config/AiConfigPage').then(m => ({ default: m.AiConfigPage })))
const ProjectSchemaPage = lazy(() => import('@/features/project/pages/config/ProjectSchemaPage').then(m => ({ default: m.ProjectSchemaPage })))
const VerificationConfigPage = lazy(() => import('@/features/project/pages/config/VerificationConfigPage').then(m => ({ default: m.VerificationConfigPage })))

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
        {/* Guest-only auth routes — shared AuthLayout (no remount on navigate) */}
        <Route element={<GuestGuard><AuthLayout /></GuestGuard>}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Route>

        {/* Protected routes */}
        <Route element={<AuthGuard><AppLayout /></AuthGuard>}>
          <Route path="/" element={<Navigate to="/projects" replace />} />
          <Route path="/projects" element={<ProjectListPage />} />
          <Route path="/projects/:publicId" element={<ProjectLayout />}>
            <Route index element={<ProjectOverviewPage />} />
            <Route path="config/target" element={<TargetConfigPage />} />
            <Route path="config/ai" element={<AiConfigPage />} />
            <Route path="config/schema" element={<ProjectSchemaPage />} />
            <Route path="config/verification" element={<VerificationConfigPage />} />
            <Route path="datasets" element={<PlaceholderPage title="Datasets" />} />
            <Route path="runs" element={<PlaceholderPage title="Test Runs" />} />
            <Route path="settings" element={<PlaceholderPage title="Project Settings" />} />
          </Route>
        </Route>
        
        <Route path="*" element={<Navigate to="/projects" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App
