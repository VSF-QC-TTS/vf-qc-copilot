import { CheckCircle2, XCircle, BrainCircuit, FlaskConical } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
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

interface AiStatusCardProps {
  config: AiConfigResponse
  onTest: () => void
  isTestPending: boolean
}

export function AiStatusCard({ config, onTest, isTestPending }: AiStatusCardProps) {
  const isSuccess = config.lastTestStatus === 'SUCCESS'

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`flex items-center justify-center size-9 rounded-full shrink-0 ${isSuccess ? 'bg-emerald-100 dark:bg-emerald-950/50' : 'bg-red-100 dark:bg-red-950/50'}`}>
              {isSuccess ? (
                <CheckCircle2 className="size-4.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <XCircle className="size-4.5 text-red-600 dark:text-red-400" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-medium">
                <BrainCircuit className="size-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">
                  {config.provider} • {config.evaluationModel}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isSuccess ? 'Kết nối thành công' : 'Kết nối thất bại'}
                {config.lastTestedAt && ` • ${timeAgo(config.lastTestedAt)}`}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onTest}
            disabled={isTestPending}
          >
            {isTestPending ? <Spinner data-icon="inline-start" /> : <FlaskConical data-icon="inline-start" />}
            Chạy thử
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
