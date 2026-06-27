import { CheckCircle2, XCircle, FlaskConical, Clock, ShieldCheck, Settings2, Globe, Database } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import type { AiConfigResponse } from '@/types/config'

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'vừa xong'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} phút trước`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`
  const days = Math.floor(hours / 24)
  return `${days} ngày trước`
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(dateStr))
}

interface AiConfigSummaryProps {
  config: AiConfigResponse
  onTest: () => void
  isTestPending: boolean
}

export function AiConfigSummary({ config, onTest, isTestPending }: AiConfigSummaryProps) {
  const isSuccess = config.lastTestStatus === 'SUCCESS'
  const hasTested = !!config.lastTestStatus

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Cell 1: Status (col-span-2) */}
      <Card className="md:col-span-2 relative overflow-hidden flex flex-col justify-between p-6 bg-card border-border shadow-sm">

        <div className="flex items-start justify-between relative z-10 h-full">
          <div className="flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground font-semibold">Active Configuration</span>
                <span className="flex items-center gap-1 text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border/50">
                  v{config.version}
                </span>
              </div>
              <h2 className="text-3xl font-semibold tracking-tight text-foreground flex items-center gap-3">
                {config.provider}
                {hasTested && (
                  <div className={`flex items-center justify-center size-7 rounded-full ${isSuccess ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/15 text-red-600 dark:text-red-400'}`}>
                    {isSuccess ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
                  </div>
                )}
              </h2>
            </div>
            {hasTested && (
              <p className="text-sm text-muted-foreground mt-4 flex items-center gap-2 font-medium">
                <span className={isSuccess ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                  {isSuccess ? 'Kết nối ổn định' : 'Kết nối thất bại'} 
                </span>
                {config.lastTestedAt && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-border" /> 
                    <span>Cập nhật {timeAgo(config.lastTestedAt)}</span>
                  </>
                )}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            onClick={onTest}
            disabled={isTestPending}
            className="shrink-0 bg-background/50 backdrop-blur-sm"
          >
            {isTestPending ? <Spinner data-icon="inline-start" /> : <FlaskConical data-icon="inline-start" />}
            Chạy thử
          </Button>
        </div>
      </Card>

      {/* Cell 2: Models (col-span-1) */}
      <Card className="p-6 flex flex-col justify-center bg-card border-border shadow-sm">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-5">
          <Database className="size-4" />
          <span className="font-semibold tracking-tight">Model Settings</span>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Evaluation Model</p>
            <p className="font-medium text-foreground tracking-tight">{config.evaluationModel || 'Chưa cấu hình'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Generation Model</p>
            <p className="font-medium text-foreground tracking-tight">{config.generationModel || 'Dùng chung Evaluation'}</p>
          </div>
        </div>
      </Card>

      {/* Cell 3: Security & Network (col-span-1) */}
      <Card className="p-5 flex flex-col gap-4 bg-card border-border shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="size-4" />
            <span className="font-semibold tracking-tight">Security</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-secondary/40 border border-border/50">
            <p className="text-[11px] font-medium text-muted-foreground mb-1 uppercase tracking-wider">Key Source</p>
            <p className="text-sm font-semibold tracking-tight">{config.keySource}</p>
          </div>
          <div className="p-3 rounded-xl bg-secondary/40 border border-border/50">
            <p className="text-[11px] font-medium text-muted-foreground mb-1 uppercase tracking-wider">API Key</p>
            <p className="text-sm font-semibold tracking-tight flex items-center gap-1.5">
              {config.hasApiKey ? (
                <><CheckCircle2 className="size-3.5 text-emerald-500" /> Đã lưu</>
              ) : (
                <><XCircle className="size-3.5 text-red-400" /> Trống</>
              )}
            </p>
          </div>
        </div>
        {config.provider === 'CUSTOM' && config.baseUrl && (
          <div className="p-3 rounded-xl bg-secondary/40 border border-border/50 overflow-hidden">
            <p className="text-[11px] font-medium text-muted-foreground mb-1 uppercase tracking-wider flex items-center gap-1.5"><Globe className="size-3" /> Base URL</p>
            <p className="text-xs font-mono tracking-tight truncate" title={config.baseUrl}>{config.baseUrl}</p>
          </div>
        )}
      </Card>

      {/* Cell 4: Advanced Params (col-span-1) */}
      <Card className="p-5 flex flex-col bg-card border-border shadow-sm">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-5">
          <Settings2 className="size-4" />
          <span className="font-semibold tracking-tight">Parameters</span>
        </div>
        <div className="grid grid-cols-2 gap-y-5 gap-x-4">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Temperature</p>
            <p className="text-base font-semibold tracking-tight mt-1">{config.temperature?.toFixed(2) ?? '-'}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Max Tokens</p>
            <p className="text-base font-semibold tracking-tight mt-1">{config.maxTokens ?? '-'}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Timeout</p>
            <p className="text-base font-semibold tracking-tight mt-1">{config.timeoutMs ? `${config.timeoutMs / 1000}s` : '-'}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Retry Count</p>
            <p className="text-base font-semibold tracking-tight mt-1">{config.retryCount ?? '-'}</p>
          </div>
        </div>
      </Card>

      {/* Cell 5: Metadata (col-span-1) */}
      <Card className="p-5 flex flex-col justify-center bg-card border-border shadow-sm">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-5">
          <Clock className="size-4" />
          <span className="font-semibold tracking-tight">Metadata</span>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Updated At</p>
            <p className="text-sm font-semibold tracking-tight mt-1">{formatDate(config.updatedAt)}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Created At</p>
            <p className="text-sm font-semibold tracking-tight mt-1 text-muted-foreground">{formatDate(config.createdAt)}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
