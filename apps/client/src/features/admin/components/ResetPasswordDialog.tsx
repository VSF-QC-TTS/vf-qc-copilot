import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { useResetAdminUserPassword } from '@/features/admin/hooks/use-admin-users'
import { ApiError } from '@/lib/api-client'
import type { UserResponse } from '@/types/api'

interface ResetPasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserResponse | null
}

export function ResetPasswordDialog({ open, onOpenChange, user }: ResetPasswordDialogProps) {
  const { t } = useTranslation('admin')
  const mutation = useResetAdminUserPassword(user?.publicId ?? '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setPassword('')
      setError(null)
    }
  }, [open])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user) {
      return
    }
    try {
      setError(null)
      await mutation.mutateAsync({ password })
      toast.success(t('users.toast.passwordReset'))
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('users.error.passwordFailed'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('users.dialog.passwordTitle')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="admin-reset-password">
                {t('users.field.newPassword')}
              </FieldLabel>
              <Input
                id="admin-reset-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={mutation.isPending}
                minLength={8}
                maxLength={72}
                required
                autoFocus
              />
            </Field>
            {error ? <FieldDescription className="text-destructive">{error}</FieldDescription> : null}
          </FieldGroup>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common:action.cancel')}
            </Button>
            <Button type="submit" disabled={mutation.isPending || password.length < 8}>
              {mutation.isPending ? <Spinner data-icon="inline-start" /> : null}
              {t('users.action.resetPassword')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
