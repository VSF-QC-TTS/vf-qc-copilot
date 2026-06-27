import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Info, SaveIcon, FlaskConical } from 'lucide-react'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

import type { AiProvider, AiExecutionResult, KeySource } from '@/types/config'
import { useAiConfig, useSaveAiConfig, useTestAiConfig } from '../../hooks/use-ai-config'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FieldGroup, Field, FieldLabel, FieldError } from '@/components/ui/field'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { AiConfigSkeleton } from '../../components/AiConfigSkeleton'
import { ConfigPageHeader } from '../../components/ConfigPageHeader'
import { AiConfigSummary } from '../../components/AiConfigSummary'
import { AiTestDialog } from '../../components/AiTestDialog'

export function AiConfigPage() {
  const { publicId } = useParams<{ publicId: string }>()
  const { t } = useTranslation(['project', 'validation'])
  const { data: config, isLoading } = useAiConfig(publicId)
  const saveMutation = useSaveAiConfig(publicId)
  const testMutation = useTestAiConfig(publicId)

  const [testResult, setTestResult] = useState<AiExecutionResult | null>(null)
  const [testDialogOpen, setTestDialogOpen] = useState(false)

  const schema = z.object({
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
    defaultValues: { provider: 'OPENAI', keySource: 'PLATFORM', evaluationModel: 'gpt-4o', apiKey: '', baseUrl: '', generationModel: '', temperature: 0.0, maxTokens: 2048, timeout: 30, retryCount: 3 },
  })

  useEffect(() => {
    if (config) {
      // Use setTimeout to ensure form is fully mounted and registered before setting values
      setTimeout(() => {
        form.setValue('provider', config.provider || 'OPENAI')
        form.setValue('keySource', config.keySource || 'PLATFORM')
        form.setValue('evaluationModel', config.evaluationModel || '')
        form.setValue('generationModel', config.generationModel || '')
        form.setValue('apiKey', config.hasApiKey ? 'SECRET_REDACTED' : '')
        form.setValue('baseUrl', config.baseUrl || '')
        form.setValue('temperature', config.temperature ?? 0.0)
        form.setValue('maxTokens', config.maxTokens ?? 2048)
        form.setValue('timeout', config.timeoutMs ? config.timeoutMs / 1000 : 30)
        form.setValue('retryCount', config.retryCount ?? 3)
      }, 0)
    }
  }, [config, form])

  const { control, handleSubmit, watch } = form
  const provider = watch('provider')
  const keySource = watch('keySource')
  
  const showBaseUrl = provider === 'CUSTOM'
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
      provider: values.provider as AiProvider, 
      keySource: values.keySource as KeySource,
      evaluationModel: values.evaluationModel,
      generationModel: values.generationModel || null,
      apiKey: values.apiKey || null, 
      baseUrl: values.baseUrl || null,
      temperature: values.temperature,
      maxTokens: values.maxTokens, 
      timeoutMs: values.timeout * 1000, 
      retryCount: values.retryCount,
    })
  }

  const handleTest = (systemPrompt: string, userMessage: string) => {
    setTestResult(null)
    testMutation.mutate({ systemPrompt, userMessage }, {
      onSuccess: (data) => setTestResult(data),
      onError: (err: any) => setTestResult({
        generatedText: null,
        promptTokens: 0,
        completionTokens: 0,
        latencyMs: 0,
        errorMessage: err.message || 'Test connection failed',
        successful: false,
      }),
    })
  }

  const handleOpenTest = () => {
    setTestResult(null)
    setTestDialogOpen(true)
  }

  if (isLoading) return <AiConfigSkeleton />

  const hasSaved = !!config?.provider
  const hasTested = !!config?.lastTestStatus

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-8 max-w-[1200px] mx-auto w-full p-6"
      >
        <ConfigPageHeader titleKey="config.judge.title" descriptionKey="config.judge.description" />

        {/* Connection Status Summary Dashboard */}
        {hasTested && (
          <AiConfigSummary
            config={config!}
          />
        )}

        {/* Config Form */}
        <motion.form
          onSubmit={handleSubmit(onSubmit)}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: hasTested ? 0.1 : 0 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
        >
          {/* Left Column: Main Configuration */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <Card>
              <CardHeader className="pb-4 border-b border-border/40 mb-4">
                <CardTitle className="text-base font-semibold">Cấu hình kết nối</CardTitle>
              </CardHeader>
              <CardContent>
                <FieldGroup className="space-y-6">
                  {/* Provider & Key Source */}
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

                  {/* API Key */}
                  {!isPersonalKey && (
                    <Controller control={control} name="apiKey" render={({ field, fieldState }) => (
                      <Field data-invalid={!!fieldState.error}>
                        <FieldLabel>API Key <span className="text-destructive">*</span></FieldLabel>
                        <Input type="password" {...field} aria-invalid={!!fieldState.error} placeholder="sk-..." />
                        <p className="text-[11px] text-muted-foreground mt-1">
                          API Key được mã hóa 2 chiều và lưu trữ an toàn trên server.
                        </p>
                        <FieldError errors={[fieldState.error]} />
                      </Field>
                    )} />
                  )}

                  {isPersonalKey && (
                    <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 p-3 border border-amber-200 dark:border-amber-900/50">
                      <p className="text-sm text-amber-800 dark:text-amber-300">
                        Bạn đã chọn cấu hình <strong>Cá nhân</strong>. API Key sẽ do từng user tự nhập ở màn hình chạy test và không được lưu trữ trên server.
                      </p>
                    </div>
                  )}

                  {showBaseUrl && (
                    <Controller control={control} name="baseUrl" render={({ field, fieldState }) => (
                      <Field data-invalid={!!fieldState.error}>
                        <FieldLabel>Base URL <span className="text-destructive">*</span></FieldLabel>
                        <Input {...field} aria-invalid={!!fieldState.error} placeholder="e.g. https://my-resource.openai.azure.com" />
                        <FieldError errors={[fieldState.error]} />
                      </Field>
                    )} />
                  )}

                  {/* Models */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Controller control={control} name="evaluationModel" render={({ field, fieldState }) => (
                      <Field data-invalid={!!fieldState.error}>
                        <FieldLabel className="flex items-center gap-1.5">
                          Evaluation Model <span className="text-destructive">*</span>
                          <Tooltip>
                            <TooltipTrigger asChild><Info className="text-muted-foreground" /></TooltipTrigger>
                            <TooltipContent><p className="max-w-xs">Model dùng để chấm điểm và phân tích kết quả.</p></TooltipContent>
                          </Tooltip>
                        </FieldLabel>
                        <Input {...field} aria-invalid={!!fieldState.error} placeholder="e.g. gpt-4o" />
                        <FieldError errors={[fieldState.error]} />
                      </Field>
                    )} />
                    <Controller control={control} name="generationModel" render={({ field, fieldState }) => (
                      <Field data-invalid={!!fieldState.error}>
                        <FieldLabel className="flex items-center gap-1.5">
                          Generation Model
                          <Tooltip>
                            <TooltipTrigger asChild><Info className="text-muted-foreground" /></TooltipTrigger>
                            <TooltipContent><p className="max-w-xs">Model dùng để tự động sinh testcase/dataset. Nếu để trống sẽ dùng chung với Evaluation model.</p></TooltipContent>
                          </Tooltip>
                        </FieldLabel>
                        <Input {...field} aria-invalid={!!fieldState.error} placeholder="e.g. gpt-4o-mini" />
                        <FieldError errors={[fieldState.error]} />
                      </Field>
                    )} />
                  </div>
                </FieldGroup>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Parameters & Actions */}
          <div className="lg:col-span-4 flex flex-col gap-6 sticky top-6">
            <Card className="bg-muted/30 border-border/60">
              <CardHeader className="pb-3 border-b border-border/40 mb-4 bg-background/50 rounded-t-xl">
                <CardTitle className="text-base font-semibold">Tham số chấm</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <Controller control={control} name="temperature" render={({ field, fieldState }) => (
                    <Field data-invalid={!!fieldState.error}>
                      <FieldLabel className="flex items-center gap-1.5 text-xs">
                        {t('config.judge.temperature', { ns: 'project' })} <span className="text-destructive">*</span>
                        <Tooltip>
                          <TooltipTrigger asChild><Info className="size-3 text-muted-foreground" /></TooltipTrigger>
                          <TooltipContent><p className="max-w-xs">0.0: Chính xác. 2.0: Sáng tạo.</p></TooltipContent>
                        </Tooltip>
                      </FieldLabel>
                      <Input type="number" step="0.1" min="0" max="2" {...field} aria-invalid={!!fieldState.error} className="h-9" />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )} />
                  <Controller control={control} name="maxTokens" render={({ field, fieldState }) => (
                    <Field data-invalid={!!fieldState.error}>
                      <FieldLabel className="flex items-center gap-1.5 text-xs">
                        {t('config.judge.maxTokens', { ns: 'project' })} <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Input type="number" {...field} aria-invalid={!!fieldState.error} className="h-9" />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Controller control={control} name="retryCount" render={({ field, fieldState }) => (
                    <Field data-invalid={!!fieldState.error}>
                      <FieldLabel className="flex items-center gap-1.5 text-xs">
                        {t('config.judge.retryCount', { ns: 'project' })} <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Input type="number" min="0" {...field} aria-invalid={!!fieldState.error} className="h-9" />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )} />
                  <Controller control={control} name="timeout" render={({ field, fieldState }) => (
                    <Field data-invalid={!!fieldState.error}>
                      <FieldLabel className="text-xs">{t('config.judge.timeoutMs', { ns: 'project' })} <span className="text-destructive">*</span></FieldLabel>
                      <Input type="number" min="1" {...field} aria-invalid={!!fieldState.error} className="h-9" />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )} />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20 shadow-sm">
              <CardContent className="p-5 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  {!hasSaved ? (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Lưu cấu hình rồi ấn Chạy thử để kiểm tra kết nối.
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Cấu hình này sẽ được áp dụng ngay cho lượt chạy tiếp theo.
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2.5">
                  <Button type="submit" disabled={saveMutation.isPending} className="w-full">
                    {saveMutation.isPending ? <Spinner data-icon="inline-start" /> : <SaveIcon data-icon="inline-start" />}
                    Lưu cấu hình
                  </Button>
                  {(hasSaved || hasTested) && (
                    <Button type="button" variant="outline" onClick={handleOpenTest} disabled={testMutation.isPending} className="w-full bg-background border-primary/20 hover:bg-primary/10 text-primary">
                      {testMutation.isPending ? <Spinner data-icon="inline-start" /> : <FlaskConical data-icon="inline-start" />}
                      Chạy thử kết nối
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.form>

        {/* AI Test Dialog */}
        <AiTestDialog
          open={testDialogOpen}
          onOpenChange={setTestDialogOpen}
          isPending={testMutation.isPending}
          result={testResult}
          onTest={handleTest}
        />
      </motion.div>
    </TooltipProvider>
  )
}
