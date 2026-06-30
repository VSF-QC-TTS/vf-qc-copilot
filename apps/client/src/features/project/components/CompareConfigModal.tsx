import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FieldGroup, Field, FieldLabel, FieldError } from '@/components/ui/field'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { TooltipProvider } from '@/components/ui/tooltip'

import { useSaveAiConfig } from '../hooks/use-ai-config'
import type { AiConfigResponse, AiProvider, KeySource } from '@/types/config'

interface CompareConfigModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData: AiConfigResponse | null
  publicId?: string
}

export function CompareConfigModal({ open, onOpenChange, initialData, publicId }: CompareConfigModalProps) {
  const { t } = useTranslation(['project', 'validation'])
  const saveMutation = useSaveAiConfig(publicId)

  const schema = z.object({
    name: z.string().min(1, 'Tên cấu hình không được để trống'),
    provider: z.enum(['OPENAI', 'ANTHROPIC', 'GEMINI', 'CUSTOM']),
    keySource: z.enum(['PLATFORM', 'PERSONAL']),
    apiKey: z.string().optional(),
    baseUrl: z.string().optional(),
    evaluationModel: z.string().min(1, t('validation.not-blank', { ns: 'validation' })),
    generationModel: z.string().optional(),
    temperature: z.coerce.number().min(0).max(2),
    maxTokens: z.coerce.number().min(1),
    timeout: z.coerce.number().min(1),
    retryCount: z.coerce.number().min(0),
  })

  type FormData = z.infer<typeof schema>

  const form = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: '',
      provider: 'OPENAI',
      keySource: 'PLATFORM',
      evaluationModel: 'gpt-4o-mini',
      apiKey: '',
      baseUrl: '',
      generationModel: '',
      temperature: 0.0,
      maxTokens: 2048,
      timeout: 30,
      retryCount: 3,
    },
  })

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          name: (initialData as any).name || '',
          provider: initialData.provider || 'OPENAI',
          keySource: initialData.keySource || 'PLATFORM',
          evaluationModel: initialData.evaluationModel || '',
          generationModel: initialData.generationModel || '',
          apiKey: initialData.hasApiKey ? 'SECRET_REDACTED' : '',
          baseUrl: initialData.baseUrl || '',
          temperature: initialData.temperature ?? 0.0,
          maxTokens: initialData.maxTokens ?? 2048,
          timeout: initialData.timeoutMs ? initialData.timeoutMs / 1000 : 30,
          retryCount: initialData.retryCount ?? 3,
        })
      } else {
        form.reset({
          name: '',
          provider: 'OPENAI',
          keySource: 'PLATFORM',
          evaluationModel: 'gpt-4o-mini',
          apiKey: '',
          baseUrl: '',
          generationModel: '',
          temperature: 0.0,
          maxTokens: 2048,
          timeout: 30,
          retryCount: 3,
        })
      }
    }
  }, [open, initialData, form])

  const { control, handleSubmit, watch } = form
  const provider = watch('provider')
  const keySource = watch('keySource')
  
  const showBaseUrl = provider === 'CUSTOM' || provider === 'AZURE_OPENAI' as any
  const isPersonalKey = keySource === 'PERSONAL'

  const DEFAULT_MODELS: Record<string, string> = {
    OPENAI: 'gpt-4o-mini',
    GEMINI: 'gemini-2.0-flash',
    ANTHROPIC: 'claude-sonnet-4-20250514',
    AZURE_OPENAI: '',
    CUSTOM: '',
  }

  const onSubmit = (values: FormData) => {
    saveMutation.mutate({
      configId: initialData?.publicId || null,
      type: 'COMPARE',
      name: values.name,
      provider: values.provider as AiProvider, 
      keySource: values.keySource as KeySource,
      evaluationModel: values.evaluationModel,
      generationModel: values.generationModel || null,
      apiKey: values.apiKey || null, 
      baseUrl: showBaseUrl ? (values.baseUrl || null) : null,
      temperature: values.temperature,
      maxTokens: values.maxTokens, 
      timeoutMs: values.timeout * 1000, 
      retryCount: values.retryCount,
    }, {
      onSuccess: () => {
        onOpenChange(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Sửa cấu hình LLM' : 'Thêm LLM so sánh'}</DialogTitle>
        </DialogHeader>
        <TooltipProvider>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
            <FieldGroup className="space-y-6">
              <Controller control={control} name="name" render={({ field, fieldState }) => (
                <Field data-invalid={!!fieldState.error}>
                  <FieldLabel>Tên gợi nhớ (Ví dụ: Claude 3.5) <span className="text-destructive">*</span></FieldLabel>
                  <Input {...field} aria-invalid={!!fieldState.error} placeholder="Tên hiển thị trên biểu đồ" />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Controller control={control} name="provider" render={({ field, fieldState }) => (
                  <Field data-invalid={!!fieldState.error}>
                    <FieldLabel>AI Provider <span className="text-destructive">*</span></FieldLabel>
                    <Select value={field.value} onValueChange={(val) => {
                      field.onChange(val)
                      if (val !== form.getValues('provider')) {
                        form.setValue('evaluationModel', DEFAULT_MODELS[val] || '')
                        form.setValue('generationModel', '')
                      }
                    }}>
                      <SelectTrigger className="w-full" aria-invalid={!!fieldState.error}><SelectValue placeholder="Chọn nhà cung cấp" /></SelectTrigger>
                      <SelectContent><SelectGroup>
                        <SelectItem value="OPENAI">{t('config.judge.providerOpenai', { ns: 'project' })}</SelectItem>
                        <SelectItem value="ANTHROPIC">{t('config.judge.providerAnthropic', { ns: 'project' })}</SelectItem>
                        <SelectItem value="GEMINI">{t('config.judge.providerGemini', { ns: 'project' })}</SelectItem>
                        <SelectItem value="CUSTOM">{t('config.judge.providerCustom', { ns: 'project' })}</SelectItem>
                      </SelectGroup></SelectContent>
                    </Select>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )} />
                <Controller control={control} name="keySource" render={({ field, fieldState }) => (
                  <Field data-invalid={!!fieldState.error}>
                    <FieldLabel>Key Source <span className="text-destructive">*</span></FieldLabel>
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full" aria-invalid={!!fieldState.error}><SelectValue placeholder="Nguồn API Key" /></SelectTrigger>
                      <SelectContent><SelectGroup>
                        <SelectItem value="PLATFORM">Nền tảng (Platform)</SelectItem>
                        <SelectItem value="PERSONAL">Cá nhân (Personal)</SelectItem>
                      </SelectGroup></SelectContent>
                    </Select>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )} />
              </div>

              {!isPersonalKey && (
                <Controller control={control} name="apiKey" render={({ field, fieldState }) => (
                  <Field data-invalid={!!fieldState.error}>
                    <FieldLabel>API Key <span className="text-destructive">*</span></FieldLabel>
                    <Input type="password" {...field} aria-invalid={!!fieldState.error} placeholder="sk-..." />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )} />
              )}

              {showBaseUrl && (
                <Controller control={control} name="baseUrl" render={({ field, fieldState }) => (
                  <Field data-invalid={!!fieldState.error}>
                    <FieldLabel>Base URL <span className="text-destructive">*</span></FieldLabel>
                    <Input {...field} aria-invalid={!!fieldState.error} placeholder="e.g. https://api.openai.com/v1" />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )} />
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Controller control={control} name="evaluationModel" render={({ field, fieldState }) => (
                  <Field data-invalid={!!fieldState.error}>
                    <FieldLabel>Model (e.g. gpt-4o) <span className="text-destructive">*</span></FieldLabel>
                    <Input {...field} aria-invalid={!!fieldState.error} />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )} />
                <Controller control={control} name="temperature" render={({ field, fieldState }) => (
                  <Field data-invalid={!!fieldState.error}>
                    <FieldLabel>Temperature <span className="text-destructive">*</span></FieldLabel>
                    <Input type="number" step="0.1" min="0" max="2" {...field} aria-invalid={!!fieldState.error} />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )} />
              </div>
            </FieldGroup>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Spinner data-icon="inline-start" />}
                Lưu cấu hình
              </Button>
            </div>
          </form>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  )
}
