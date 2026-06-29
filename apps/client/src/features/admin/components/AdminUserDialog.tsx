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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import {
  useCreateAdminUser,
  useUpdateAdminUser,
} from '@/features/admin/hooks/use-admin-users'
import { ApiError } from '@/lib/api-client'
import { USER_ROLES, USER_STATUSES } from '@/types/admin'
import type { UserResponse, UserRole, UserStatus } from '@/types/api'

interface AdminUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserResponse | null
}

export function AdminUserDialog({ open, onOpenChange, user }: AdminUserDialogProps) {
  const { t } = useTranslation('admin')
  const createMutation = useCreateAdminUser()
  const updateMutation = useUpdateAdminUser(user?.publicId ?? '')
  const isEdit = user != null
  const isPending = createMutation.isPending || updateMutation.isPending

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [role, setRole] = useState<UserRole>('QC_MEMBER')
  const [status, setStatus] = useState<UserStatus>('ACTIVE')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }
    setEmail(user?.email ?? '')
    setPassword('')
    setDisplayName(user?.displayName ?? '')
    setAvatarUrl(user?.avatarUrl ?? '')
    setRole(user?.role ?? 'QC_MEMBER')
    setStatus(user?.status ?? 'ACTIVE')
    setError(null)
  }, [open, user])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      setError(null)
      if (isEdit && user) {
        await updateMutation.mutateAsync({
          displayName: displayName.trim() || null,
          avatarUrl: avatarUrl.trim() || null,
          role,
          status,
        })
        toast.success(t('users.toast.updated'))
      } else {
        await createMutation.mutateAsync({
          email: email.trim(),
          password,
          displayName: displayName.trim() || null,
          role,
          status,
        })
        toast.success(t('users.toast.created'))
      }
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('users.error.saveFailed'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('users.dialog.editTitle') : t('users.dialog.createTitle')}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="admin-user-email">{t('users.field.email')}</FieldLabel>
              <Input
                id="admin-user-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isEdit || isPending}
                required
              />
            </Field>
            {!isEdit ? (
              <Field>
                <FieldLabel htmlFor="admin-user-password">{t('users.field.password')}</FieldLabel>
                <Input
                  id="admin-user-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={isPending}
                  minLength={8}
                  maxLength={72}
                  required
                />
              </Field>
            ) : null}
            <Field>
              <FieldLabel htmlFor="admin-user-display-name">
                {t('users.field.displayName')}
              </FieldLabel>
              <Input
                id="admin-user-display-name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                disabled={isPending}
                maxLength={255}
              />
            </Field>
            {isEdit ? (
              <Field>
                <FieldLabel htmlFor="admin-user-avatar">{t('users.field.avatarUrl')}</FieldLabel>
                <Input
                  id="admin-user-avatar"
                  value={avatarUrl}
                  onChange={(event) => setAvatarUrl(event.target.value)}
                  disabled={isPending}
                  maxLength={512}
                />
              </Field>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>{t('users.field.role')}</FieldLabel>
                <Select
                  value={role}
                  onValueChange={(value) => setRole(value as UserRole)}
                  disabled={isPending}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_ROLES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {t(`users.role.${item}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>{t('users.field.status')}</FieldLabel>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as UserStatus)}
                  disabled={isPending}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_STATUSES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {t(`users.status.${item}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            {error ? <FieldDescription className="text-destructive">{error}</FieldDescription> : null}
          </FieldGroup>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common:action.cancel')}
            </Button>
            <Button type="submit" disabled={isPending || !email.trim() || (!isEdit && password.length < 8)}>
              {isPending ? <Spinner data-icon="inline-start" /> : null}
              {t('common:action.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
