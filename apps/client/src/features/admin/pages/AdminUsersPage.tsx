import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyRound, Pencil, Plus, Search, ShieldCheck, UserX } from 'lucide-react'
import { toast } from 'sonner'

import { AdminUserDialog } from '@/features/admin/components/AdminUserDialog'
import { ResetPasswordDialog } from '@/features/admin/components/ResetPasswordDialog'
import {
  useAdminUsers,
  useDisableAdminUser,
} from '@/features/admin/hooks/use-admin-users'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ApiError } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import type { UserResponse, UserStatus } from '@/types/api'

const PAGE_SIZE = 20

export function AdminUsersPage() {
  const { t } = useTranslation('admin')
  const [page, setPage] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null)
  const [resetUser, setResetUser] = useState<UserResponse | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const disableMutation = useDisableAdminUser()
  const { data, isLoading, isError, refetch } = useAdminUsers(page, PAGE_SIZE, search)

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPage(0)
    setSearch(searchInput.trim())
  }

  const handleDisable = async (user: UserResponse) => {
    if (!window.confirm(t('users.confirm.disable', { email: user.email }))) {
      return
    }
    try {
      await disableMutation.mutateAsync(user.publicId)
      toast.success(t('users.toast.disabled'))
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('users.error.disableFailed'))
    }
  }

  return (
    <div className="flex h-full flex-col gap-5 p-4 sm:p-6">
      <div className="flex flex-col gap-4 border-b border-border pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <ShieldCheck className="size-4" />
            <span>{t('title.kicker')}</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-normal text-foreground">
            {t('title.users')}
          </h1>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <form className="flex min-w-0 gap-2" onSubmit={handleSearch}>
            <Input
              className="h-9 w-full sm:w-72"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={t('users.searchPlaceholder')}
            />
            <Button type="submit" variant="outline" size="lg">
              <Search data-icon="inline-start" />
              {t('users.action.search')}
            </Button>
          </form>
          <Button size="lg" onClick={() => setCreateOpen(true)}>
            <Plus data-icon="inline-start" />
            {t('users.action.create')}
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('users.column.user')}</TableHead>
              <TableHead>{t('users.column.role')}</TableHead>
              <TableHead>{t('users.column.status')}</TableHead>
              <TableHead>{t('users.column.lastLogin')}</TableHead>
              <TableHead className="w-[180px] text-right">{t('users.column.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <UserRowsSkeleton /> : null}
            {isError ? (
              <TableRow>
                <TableCell colSpan={5} className="h-40 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {t('users.error.loadFailed')}
                    </span>
                    <Button variant="outline" onClick={() => refetch()}>
                      {t('common:action.retry')}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : null}
            {!isLoading && !isError && data?.content.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-40 text-center text-sm text-muted-foreground">
                  {t('users.empty')}
                </TableCell>
              </TableRow>
            ) : null}
            {data?.content.map((user) => (
              <TableRow key={user.publicId}>
                <TableCell>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-medium text-foreground">{user.displayName}</span>
                    <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                    {t(`users.role.${user.role}`)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <StatusBadge status={user.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(user.lastLoginAt, t('users.never'))}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      title={t('users.action.edit')}
                      onClick={() => setEditingUser(user)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      title={t('users.action.resetPassword')}
                      onClick={() => setResetUser(user)}
                    >
                      <KeyRound />
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon-sm"
                      title={t('users.action.disable')}
                      disabled={user.status === 'DISABLED' || disableMutation.isPending}
                      onClick={() => handleDisable(user)}
                    >
                      <UserX />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {t('users.pagination.total', { count: data?.totalElements ?? 0 })}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0 || isLoading}
            onClick={() => setPage((current) => Math.max(current - 1, 0))}
          >
            {t('users.pagination.previous')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={data?.last ?? true}
            onClick={() => setPage((current) => current + 1)}
          >
            {t('users.pagination.next')}
          </Button>
        </div>
      </div>

      <AdminUserDialog open={createOpen} onOpenChange={setCreateOpen} user={null} />
      <AdminUserDialog
        open={editingUser != null}
        onOpenChange={(open) => {
          if (!open) setEditingUser(null)
        }}
        user={editingUser}
      />
      <ResetPasswordDialog
        open={resetUser != null}
        onOpenChange={(open) => {
          if (!open) setResetUser(null)
        }}
        user={resetUser}
      />
    </div>
  )
}

function StatusBadge({ status }: { status: UserStatus }) {
  const { t } = useTranslation('admin')
  return (
    <Badge
      variant="outline"
      className={cn(
        status === 'ACTIVE' && 'border-success-500/30 bg-success-500/10 text-success-600',
        status === 'DISABLED' && 'border-destructive/30 bg-destructive/10 text-destructive',
      )}
    >
      {t(`users.status.${status}`)}
    </Badge>
  )
}

function UserRowsSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, index) => (
        <TableRow key={index}>
          <TableCell>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
          </TableCell>
          <TableCell><Skeleton className="h-5 w-20" /></TableCell>
          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
          <TableCell><Skeleton className="ml-auto h-7 w-28" /></TableCell>
        </TableRow>
      ))}
    </>
  )
}

function formatDate(value: string | null, fallback: string) {
  if (!value) {
    return fallback
  }
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
