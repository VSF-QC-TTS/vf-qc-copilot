import * as React from 'react'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export type FloatingInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: React.ReactNode
}

export const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ className, id, label, error, ...props }, ref) => {
    return (
      <Field data-invalid={!!error}>
        <div className="relative">
          <Input
            id={id}
            ref={ref}
            placeholder=" "
            className={cn(
              'peer flex h-14 w-full px-3.5 pb-2 pt-6 bg-white/40 dark:bg-zinc-950/40 border-black/10 dark:border-white/10 transition-colors hover:bg-white/60 dark:hover:bg-zinc-950/60 focus:bg-white/60 dark:focus:bg-zinc-950/60',
              className
            )}
            aria-invalid={!!error}
            {...props}
          />
          <FieldLabel
            htmlFor={id}
            className={cn(
              'pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground transition-all duration-200',
              'peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm',
              'peer-focus:top-4 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:text-primary',
              'peer-[:not(:placeholder-shown)]:top-4 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-xs'
            )}
          >
            {label}
          </FieldLabel>
        </div>
        {error && <FieldError>{error}</FieldError>}
      </Field>
    )
  }
)
FloatingInput.displayName = 'FloatingInput'
