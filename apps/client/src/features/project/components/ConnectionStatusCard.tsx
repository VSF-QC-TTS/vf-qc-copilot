import { CheckCircle2, XCircle, Clock, RefreshCwIcon, EyeIcon } from 'lucide-react'
import { motion } from 'motion/react'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn(
        "overflow-hidden border shadow-sm transition-all duration-300 relative group",
        isSuccess 
          ? "border-emerald-500/25 bg-emerald-500/5 dark:bg-emerald-950/10 text-emerald-950 dark:text-emerald-50" 
          : "border-red-500/25 bg-red-500/5 dark:bg-red-950/10 text-red-950 dark:text-red-50"
      )}>
        {/* Decorative corner light overlay */}
        <div className={cn(
          "absolute top-0 right-0 w-24 h-24 blur-2xl opacity-20 pointer-events-none rounded-full transition-transform duration-500 group-hover:scale-110",
          isSuccess ? "bg-emerald-500" : "bg-red-500"
        )} />

        <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-5 px-6 relative z-10">
          {/* Left: Status info */}
          <div className="flex items-start sm:items-center gap-4 min-w-0">
            <div className={cn(
              "flex items-center justify-center size-12 rounded-full shrink-0 shadow-inner border",
              isSuccess 
                ? "bg-emerald-100/80 dark:bg-emerald-900/30 border-emerald-500/20" 
                : "bg-red-100/80 dark:bg-red-900/30 border-red-500/20"
            )}>
              {isSuccess ? (
                <CheckCircle2 className="size-6 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <XCircle className="size-6 text-red-600 dark:text-red-400 animate-pulse" />
              )}
            </div>

            <div className="flex flex-col gap-0.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm tracking-tight">
                  {isSuccess ? 'Kết nối thành công' : 'Kết nối thất bại'}
                </span>
                <Badge variant="outline" className={cn(
                  "text-[10px] font-mono px-2 py-0 border font-bold uppercase",
                  isSuccess 
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                    : "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-300"
                )}>
                  {config.method}
                </Badge>
              </div>
              <p className="text-xs opacity-75 font-mono truncate max-w-xs sm:max-w-md mt-0.5">
                {config.url}
              </p>
              {config.lastTestedAt && (
                <div className="flex items-center gap-1.5 text-[11px] opacity-65 mt-1">
                  <Clock className="size-3" />
                  <span>
                    Kiểm tra: {timeAgo(config.lastTestedAt)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0 sm:self-center self-end mt-2 sm:mt-0">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={onTest}
                disabled={isTestPending}
                className={cn(
                  "shadow-xs text-xs font-semibold cursor-pointer border border-border/80 bg-background/50 hover:bg-background/80",
                  isSuccess 
                    ? "hover:border-emerald-500/30 text-emerald-950 dark:text-emerald-50"
                    : "hover:border-red-500/30 text-red-950 dark:text-red-50"
                )}
              >
                {isTestPending ? <Spinner data-icon="inline-start" /> : <RefreshCwIcon data-icon="inline-start" />}
                Kiểm tra lại
              </Button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={onViewDetail}
                className="text-xs font-semibold hover:bg-background/35 dark:hover:bg-zinc-800/35 cursor-pointer text-foreground/80 hover:text-foreground"
              >
                <EyeIcon data-icon="inline-start" />
                Xem chi tiết
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
