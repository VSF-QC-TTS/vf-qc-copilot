import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Info, ChevronDown, SaveIcon } from 'lucide-react'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

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
import { AiStatusCard } from '../../components/AiStatusCard'
import { AiTestDialog } from '../../components/AiTestDialog'

export function AiConfigPage() {
  const { publicId } = useParams<{ publicId: string }>()
  const { t } = useTranslation(['project', 'validation'])
  const { data: config, isLoading } = useAiConfig(publicId)
  const saveMutation = useSaveAiConfig(publicId)
  const testMutation = useTestAiConfig(publicId)

  const [testResult, setTestResult] = useState<AiExecutionResult | null>(null)
  const [testDialogOpen, setTestDialogOpen] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)

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

  useEffect(() => {
    if (config) {
      form.reset({
        provider: config.provider || 'OPENAI',
        keySource: config.keySource || 'PLATFORM',
        evaluationModel: config.evaluationModel || '',
        generationModel: config.generationModel || '',
        apiKey: config.hasApiKey ? 'SECRET_REDACTED' : '',
        baseUrl: config.baseUrl || '',
        temperature: config.temperature ?? 0.0,
        maxTokens: config.maxTokens ?? 2048,
        timeout: (config.timeoutMs ?? 30000) / 1000,
        retryCount: config.retryCount ?? 3,
      });
    }
  }, [config, form])

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
        className="flex flex-col gap-6 max-w-[900px] mx-auto w-full p-6"
      >
        <ConfigPageHeader titleKey="config.judge.title" descriptionKey="config.judge.description" />

        {/* Connection Status */}
        {hasTested && (
          <AiStatusCard
            config={config!}
            onTest={handleOpenTest}
            isTestPending={testMutation.isPending}
          />
        )}

        {/* Config Form */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: hasTested ? 0.1 : 0 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Cấu hình AI Model</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)}>
                <FieldGroup className="space-y-5">
                  
                  {/* Provider & Key Source */}
                  <div className="grid grid-cols-2 gap-4">
                    <Controller control={control} name="provider" render={({ field, fieldState }) => (
                      <Field data-invalid={!!fieldState.error}>
                        <FieldLabel>AI Provider</FieldLabel>
                        <Select value={field.value} onValueChange={(val) => {
                          field.onChange(val)
                          if (!config || val !== config.provider) {
                            form.setValue('evaluationModel', DEFAULT_MODELS[val] || '', { shouldValidate: true })
                            form.setValue('generationModel', '', { shouldValidate: true })
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
                        <FieldLabel>Key Source</FieldLabel>
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
                        <FieldLabel>{t('config.judge.apiKey', { ns: 'project' })}</FieldLabel>
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
                        <FieldLabel>{t('config.judge.baseUrl', { ns: 'project' })}</FieldLabel>
                        <Input {...field} aria-invalid={!!fieldState.error} placeholder="e.g. https://my-resource.openai.azure.com" />
                        <FieldError errors={[fieldState.error]} />
                      </Field>
                    )} />
                  )}

                  {/* Models */}
                  <div className="grid grid-cols-2 gap-4">
                    <Controller control={control} name="evaluationModel" render={({ field, fieldState }) => (
                      <Field data-invalid={!!fieldState.error}>
                        <FieldLabel className="flex items-center gap-1.5">
                          Evaluation Model
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
                          Generation Model (Tùy chọn)
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

                  {/* Advanced Settings — collapsible */}
                  <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ChevronDown className={`transition-transform duration-200 ${advancedOpen ? 'rotate-180' : ''}`} />
                        Thông số nâng cao
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="grid grid-cols-2 gap-4 pt-4">
                        <Controller control={control} name="temperature" render={({ field, fieldState }) => (
                          <Field data-invalid={!!fieldState.error}>
                            <FieldLabel className="flex items-center gap-1.5">
                              {t('config.judge.temperature', { ns: 'project' })}
                              <Tooltip>
                                <TooltipTrigger asChild><Info className="text-muted-foreground" /></TooltipTrigger>
                                <TooltipContent><p className="max-w-xs">0.0: Chính xác, theo khuôn mẫu. 2.0: Phá cách, sáng tạo.</p></TooltipContent>
                              </Tooltip>
                            </FieldLabel>
                            <Input type="number" step="0.1" min="0" max="2" {...field} aria-invalid={!!fieldState.error} />
                            <FieldError errors={[fieldState.error]} />
                          </Field>
                        )} />
                        <Controller control={control} name="maxTokens" render={({ field, fieldState }) => (
                          <Field data-invalid={!!fieldState.error}>
                            <FieldLabel className="flex items-center gap-1.5">
                              {t('config.judge.maxTokens', { ns: 'project' })}
                              <Tooltip>
                                <TooltipTrigger asChild><Info className="text-muted-foreground" /></TooltipTrigger>
                                <TooltipContent><p className="max-w-xs">Giới hạn độ dài câu trả lời của AI.</p></TooltipContent>
                              </Tooltip>
                            </FieldLabel>
                            <Input type="number" {...field} aria-invalid={!!fieldState.error} />
                            <FieldError errors={[fieldState.error]} />
                          </Field>
                        )} />
                        <Controller control={control} name="retryCount" render={({ field, fieldState }) => (
                          <Field data-invalid={!!fieldState.error}>
                            <FieldLabel className="flex items-center gap-1.5">
                              {t('config.judge.retryCount', { ns: 'project' })}
                              <Tooltip>
                                <TooltipTrigger asChild><Info className="text-muted-foreground" /></TooltipTrigger>
                                <TooltipContent><p className="max-w-xs">Số lần tự động gọi lại API nếu lần đầu bị lỗi.</p></TooltipContent>
                              </Tooltip>
                            </FieldLabel>
                            <Input type="number" min="0" {...field} aria-invalid={!!fieldState.error} />
                            <FieldError errors={[fieldState.error]} />
                          </Field>
                        )} />
                        <Controller control={control} name="timeout" render={({ field, fieldState }) => (
                          <Field data-invalid={!!fieldState.error}>
                            <FieldLabel>{t('config.judge.timeoutMs', { ns: 'project' })}</FieldLabel>
                            <Input type="number" min="1" {...field} aria-invalid={!!fieldState.error} />
                            <FieldError errors={[fieldState.error]} />
                          </Field>
                        )} />
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    {!hasSaved && (
                      <p className="text-xs text-muted-foreground">
                        Lưu cấu hình rồi ấn Chạy thử để kiểm tra kết nối
                      </p>
                    )}
                    <div className="flex items-center gap-3 ml-auto">
                      {hasSaved && !hasTested && (
                        <Button type="button" variant="outline" onClick={handleOpenTest}>
                          Chạy thử
                        </Button>
                      )}
                      <Button type="submit" disabled={saveMutation.isPending}>
                        {saveMutation.isPending ? <Spinner data-icon="inline-start" /> : <SaveIcon data-icon="inline-start" />}
                        Lưu
                      </Button>
                    </div>
                  </div>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
        </motion.div>

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
