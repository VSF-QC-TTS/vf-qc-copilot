import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
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

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="text-center"
    >
      {/* Status indicator — subtle colored line instead of circle icon */}
      <div className={cn('mx-auto mb-5 h-1 w-10 rounded-full', {
        'bg-emerald-500': icon === 'success' || icon === 'email',
        'bg-destructive': icon === 'error',
      })} />

      <h2 className="text-xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
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
    </motion.div>
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
