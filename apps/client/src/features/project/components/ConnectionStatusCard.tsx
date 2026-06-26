import { CheckCircle2, XCircle, Clock, RefreshCwIcon, EyeIcon } from 'lucide-react'
import { motion } from 'motion/react'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

function timeAgo(dateString: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000)
  if (seconds < 60) return 'vừa xong'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} phút trước`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`
  const days = Math.floor(hours / 24)
  return `${days} ngày trước`
}

import type { TargetConfigResponse } from '@/types/config'

interface ConnectionStatusCardProps {
  config: TargetConfigResponse
  onTest: () => void
  onViewDetail: () => void
  isTestPending: boolean
}

export function ConnectionStatusCard({ config, onTest, onViewDetail, isTestPending }: ConnectionStatusCardProps) {
  const isSuccess = config.lastTestStatus === 'SUCCESS'

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`overflow-hidden border-l-4 ${isSuccess ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
        <CardContent className="flex items-center justify-between gap-4 py-4 px-5">
          {/* Left: Status info */}
          <div className="flex items-center gap-4 min-w-0">
            <div className={`flex items-center justify-center size-10 rounded-full shrink-0 ${isSuccess ? 'bg-emerald-100 dark:bg-emerald-950/50' : 'bg-red-100 dark:bg-red-950/50'}`}>
              {isSuccess ? (
                <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <XCircle className="size-5 text-red-600 dark:text-red-400" />
              )}
            </div>

            <div className="flex flex-col gap-0.5 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">
                  {isSuccess ? 'Kết nối thành công' : 'Kết nối thất bại'}
                </span>
                <Badge variant="outline" className="text-[11px] px-1.5 py-0 font-mono">
                  {config.method}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate max-w-md">
                {config.url}
              </p>
              {config.lastTestedAt && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                  <Clock className="size-3" />
                  <span>
                    {timeAgo(config.lastTestedAt)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onTest}
              disabled={isTestPending}
            >
              {isTestPending ? <Spinner data-icon="inline-start" /> : <RefreshCwIcon data-icon="inline-start" />}
              Kiểm tra lại
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewDetail}
            >
              <EyeIcon data-icon="inline-start" />
              Xem chi tiết
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
