import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import { CheckCircle2, AlertCircle, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

// ---------------------------------------------------------------------------
// Shared result state components for auth pages
// ---------------------------------------------------------------------------

type AuthResultProps = {
  icon: 'success' | 'error' | 'email'
  title: string
  message: string
  linkTo?: string
  linkText?: string
  linkVariant?: 'text' | 'button'
  actionButton?: {
    href: string
    label: string
  }
}

const iconConfig = {
  success: { Icon: CheckCircle2, bg: 'bg-emerald-500/10', color: 'text-emerald-500' },
  error: { Icon: AlertCircle, bg: 'bg-destructive/10', color: 'text-destructive' },
  email: { Icon: Mail, bg: 'bg-emerald-500/10', color: 'text-emerald-500' },
}

/**
 * Reusable auth result state — success, error, or check-email.
 * Rendered inside AuthLayout's Outlet — no self-wrapping needed.
 */
export function AuthResult({
  icon,
  title,
  message,
  linkTo,
  linkText,
  linkVariant = 'text',
  actionButton,
}: AuthResultProps) {
  const reduceMotion = useReducedMotion()
  const { Icon, bg, color } = iconConfig[icon]

  return (
    <div className="text-center">
      <motion.div
        initial={reduceMotion ? false : { scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className={cn('mx-auto mb-4 flex size-12 items-center justify-center rounded-full', bg)}
      >
        <Icon className={cn('size-6', color)} />
      </motion.div>

      <h2 className="text-lg font-semibold text-foreground">
        {title}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {message}
      </p>

      {actionButton && (
        <a href={actionButton.href} target="_blank" rel="noopener noreferrer" className="mt-6 block">
          <Button variant="default" className="w-full">{actionButton.label}</Button>
        </a>
      )}

      {linkTo && linkText && (
        linkVariant === 'button' ? (
          <Link to={linkTo} className={cn("block", actionButton ? "mt-3" : "mt-6")}>
            <Button variant={actionButton ? "outline" : "default"} className="w-full">{linkText}</Button>
          </Link>
        ) : (
          <Link
            to={linkTo}
            className={cn("inline-block text-sm font-medium text-primary hover:text-primary/80", actionButton ? "mt-4" : "mt-6")}
          >
            {linkText}
          </Link>
        )
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Skeleton for loading states (replaces spinner)
// ---------------------------------------------------------------------------

export function AuthSkeleton({ title, message }: { title: string; message: string }) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center">
        <Skeleton className="size-8 rounded-full" />
      </div>
      <h2 className="text-lg font-semibold text-foreground">
        {title}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {message}
      </p>
      <div className="mt-4 flex flex-col gap-2">
        <Skeleton className="mx-auto h-2 w-3/4 rounded" />
        <Skeleton className="mx-auto h-2 w-1/2 rounded" />
      </div>
    </div>
  )
}
