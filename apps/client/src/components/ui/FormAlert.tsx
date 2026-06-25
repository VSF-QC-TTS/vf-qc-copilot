import { cn } from '@/lib/utils'
import { AlertCircle } from 'lucide-react'

type FormAlertProps = {
  message: string
  className?: string
}

export function FormAlert({ message, className }: FormAlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive',
        className,
      )}
    >
      <AlertCircle className="size-4 shrink-0" />
      {message}
    </div>
  )
}
