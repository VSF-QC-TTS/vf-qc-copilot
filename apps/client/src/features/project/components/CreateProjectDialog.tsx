import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FieldGroup, Field, FieldLabel, FieldDescription } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useCreateProject } from '@/features/project/hooks/use-projects'
import { ApiError } from '@/lib/api-client'

interface CreateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
  const { t } = useTranslation('project')
  const navigate = useNavigate()
  const { mutateAsync: createProject, isPending } = useCreateProject()
  
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    
    try {
      setError(null)
      const res = await createProject({ name, description: description || null })
      toast.success(t('create.success'))
      onOpenChange(false)
      setName('')
      setDescription('')
      navigate(`/projects/${res.publicId}`)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Failed to create project')
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('create.title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field data-invalid={error != null ? true : undefined}>
              <FieldLabel htmlFor="project-name">{t('create.nameLabel')}</FieldLabel>
              <Input
                id="project-name"
                placeholder={t('create.namePlaceholder')}
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setError(null)
                }}
                disabled={isPending}
                aria-invalid={error != null ? true : undefined}
                autoFocus
              />
              {error && <FieldDescription className="text-destructive">{error}</FieldDescription>}
            </Field>
            <Field>
              <FieldLabel htmlFor="project-desc">{t('create.descLabel')}</FieldLabel>
              <Textarea
                id="project-desc"
                placeholder={t('create.descPlaceholder')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isPending}
              />
            </Field>
          </FieldGroup>
          <div className="mt-6 flex justify-end">
            <Button disabled={isPending || !name.trim()} type="submit">
              {isPending && <Spinner data-icon="inline-start" />}
              {isPending ? t('create.submittingBtn') : t('create.submitBtn')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
