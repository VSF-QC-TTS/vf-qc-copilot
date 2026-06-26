import { ShieldCheckIcon, Clock, FileJson2Icon } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

import type { TargetConfigResponse, TestExecutionResult } from '@/types/config'

interface ConfigDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  config: TargetConfigResponse | null
  lastTestResult?: TestExecutionResult | null
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</h4>
      {children}
    </div>
  )
}

function KeyValueRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-muted-foreground shrink-0 min-w-[100px]">{label}:</span>
      <span className={`break-all ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  )
}

export function ConfigDetailSheet({ open, onOpenChange, config, lastTestResult }: ConfigDetailSheetProps) {
  if (!config) return null

  const headers = config.maskedHeaders || {}
  const queryParams = config.maskedQueryParams || {}
  const isSuccess = config.lastTestStatus === 'SUCCESS'

  let responseBodyParsed: any = null
  if (lastTestResult?.responseBody) {
    try {
      responseBodyParsed = JSON.parse(lastTestResult.responseBody)
    } catch {
      // keep null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto gap-0 p-0">
        <DialogHeader className="px-6 pt-5 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <FileJson2Icon className="size-5" />
            Chi tiết Cấu hình
          </DialogTitle>
          <DialogDescription>
            Thông tin chi tiết về cấu hình API Target đã lưu.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 px-6 py-5">
          {/* Endpoint */}
          <DetailSection title="Endpoint">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">{config.method}</Badge>
              <span className="text-sm font-mono break-all">{config.url}</span>
            </div>
            <KeyValueRow label="Timeout" value={`${config.timeoutMs}ms`} />
            {config.responsePath && (
              <KeyValueRow label="Response Path" value={config.responsePath} mono />
            )}
          </DetailSection>

          <Separator />

          {/* Headers */}
          <DetailSection title="Headers">
            {Object.keys(headers).length > 0 ? (
              <div className="flex flex-col gap-1.5 bg-muted/30 rounded-md p-3">
                {Object.entries(headers).map(([key, value]) => (
                  <div key={key} className="flex items-start gap-2 text-xs font-mono">
                    <span className="text-muted-foreground shrink-0">{key}:</span>
                    <span className={`break-all ${value === 'SECRET_REDACTED' ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                      {value === 'SECRET_REDACTED' ? (
                        <span className="flex items-center gap-1">
                          <ShieldCheckIcon className="size-3" />
                          ••••••••
                        </span>
                      ) : value}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Không có headers</p>
            )}
          </DetailSection>

          {/* Query Params */}
          {Object.keys(queryParams).length > 0 && (
            <>
              <Separator />
              <DetailSection title="Query Parameters">
                <div className="flex flex-col gap-1.5 bg-muted/30 rounded-md p-3">
                  {Object.entries(queryParams).map(([key, value]) => (
                    <div key={key} className="flex items-start gap-2 text-xs font-mono">
                      <span className="text-muted-foreground shrink-0">{key}:</span>
                      <span className={`break-all ${value === 'SECRET_REDACTED' ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                        {value === 'SECRET_REDACTED' ? (
                          <span className="flex items-center gap-1">
                            <ShieldCheckIcon className="size-3" />
                            ••••••••
                          </span>
                        ) : value}
                      </span>
                    </div>
                  ))}
                </div>
              </DetailSection>
            </>
          )}

          {/* Body Template */}
          {config.bodyTemplate && (
            <>
              <Separator />
              <DetailSection title="Body Template">
                <pre className="text-xs font-mono bg-muted/30 rounded-md p-3 overflow-auto max-h-[200px] whitespace-pre-wrap break-all">
                  {(() => {
                    try {
                      return JSON.stringify(JSON.parse(config.bodyTemplate), null, 2)
                    } catch {
                      return config.bodyTemplate
                    }
                  })()}
                </pre>
              </DetailSection>
            </>
          )}

          {/* Last Test Result */}
          {lastTestResult && (
            <>
              <Separator />
              <DetailSection title="Kết quả test cuối">
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant={isSuccess ? 'default' : 'destructive'}
                    className={isSuccess ? 'bg-emerald-500 text-white' : ''}
                  >
                    {lastTestResult.httpStatus} {isSuccess ? 'OK' : 'ERROR'}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    {lastTestResult.latencyMs}ms
                  </div>
                </div>
                {lastTestResult.errorMessage ? (
                  <div className="text-sm text-destructive bg-destructive/10 rounded-md p-3">
                    {lastTestResult.errorMessage}
                  </div>
                ) : (
                  <pre className="text-xs font-mono bg-muted/30 rounded-md p-3 overflow-auto max-h-[300px] whitespace-pre-wrap break-all">
                    {responseBodyParsed
                      ? JSON.stringify(responseBodyParsed, null, 2)
                      : lastTestResult.responseBody || 'No response body'}
                  </pre>
                )}
              </DetailSection>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
