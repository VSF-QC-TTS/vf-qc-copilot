import * as React from 'react'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { InputGroup, InputGroupInput, InputGroupAddon, InputGroupButton } from '@/components/ui/input-group'
import { cn } from '@/lib/utils'

export type FloatingPasswordInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string
  error?: React.ReactNode
}

export const FloatingPasswordInput = React.forwardRef<HTMLInputElement, FloatingPasswordInputProps>(
  ({ className, id, label, error, ...props }, ref) => {
    const [visible, setVisible] = useState(false)

    return (
      <Field data-invalid={!!error}>
        <InputGroup className="h-14 bg-white/40 dark:bg-zinc-950/40 border-black/10 dark:border-white/10 transition-colors hover:bg-white/60 dark:hover:bg-zinc-950/60 focus-within:bg-white/60 dark:focus-within:bg-zinc-950/60">
          <InputGroupInput
            id={id}
            ref={ref}
            type={visible ? 'text' : 'password'}
            placeholder=" "
            className={cn('peer px-3.5 pb-2 pt-6', className)}
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
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setVisible((v) => !v)}
              aria-label={visible ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {visible ? <EyeOff /> : <Eye />}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
        {error && <FieldError>{error}</FieldError>}
      </Field>
    )
  }
)
FloatingPasswordInput.displayName = 'FloatingPasswordInput'
