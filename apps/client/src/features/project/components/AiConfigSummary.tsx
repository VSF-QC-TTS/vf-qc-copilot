import { CheckCircle2, XCircle, Clock } from 'lucide-react'
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

interface AiConfigSummaryProps {
  config: AiConfigResponse
}

export function AiConfigSummary({ config }: AiConfigSummaryProps) {
  const isSuccess = config.lastTestStatus === 'SUCCESS'
  const hasTested = !!config.lastTestStatus

  if (!hasTested) return null

  return (
    <div className={`px-4 py-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm transition-colors ${
      isSuccess 
        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300' 
        : 'bg-red-500/10 border-red-500/20 text-red-800 dark:text-red-300'
    }`}>
      <div className="flex items-center gap-2 font-medium">
        {isSuccess ? <CheckCircle2 className="size-4 shrink-0" /> : <XCircle className="size-4 shrink-0" />}
        <span>{isSuccess ? 'Trạng thái: Kết nối ổn định' : 'Trạng thái: Kết nối thất bại'}</span>
      </div>
      
      {config.lastTestedAt && (
        <span className="opacity-80 font-normal flex items-center gap-1.5 text-xs sm:text-sm">
          <Clock className="size-3.5 shrink-0" />
          Cập nhật {timeAgo(config.lastTestedAt)}
        </span>
      )}
    </div>
  )
}

