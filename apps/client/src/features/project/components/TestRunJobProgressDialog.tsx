import { useEffect, useState } from 'react'
import { CheckCircle2, CircleAlert, CircleX, FileSpreadsheet, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { streamTestRunJobEvents } from '@/lib/test-run-api'
import type { TestRunJobResponse } from '@/types/test-run'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { JobProgressAnimation } from './JobProgressAnimation'

const TEST_RUN_EXPORT_PHRASES = [
  'Đang khởi tạo tiến trình xuất báo cáo...',
  'Đang tải dữ liệu ca test và kết quả...',
  'Đang lập cấu trúc bảng Excel...',
  'Đang ghi dữ liệu và định dạng file...',
  'Sắp hoàn tất...',
] as const

interface TestRunJobProgressDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  job: TestRunJobResponse | null
  onComplete: (event: TestRunJobResponse) => void
}

export function TestRunJobProgressDialog({
  open,
  onOpenChange,
  job,
  onComplete,
}: TestRunJobProgressDialogProps) {
  const [event, setEvent] = useState<TestRunJobResponse | null>(null)

  const currentStatus = event?.status ?? job?.status ?? 'QUEUED'
  const currentProgress = event?.progress ?? job?.progress ?? 0
  const isFinished = isTerminalStatus(currentStatus)

  const displayMessage = event?.message ?? job?.message ?? 'Đang chuẩn bị xuất báo cáo...'

  useEffect(() => {
    setEvent(job)
  }, [job])

  useEffect(() => {
    if (!open || !job) {
      return
    }

    const controller = new AbortController()
    void streamTestRunJobEvents(
      job.publicId,
      (nextEvent) => {
        setEvent(nextEvent)
        if (isTerminalStatus(nextEvent.status)) {
          onComplete(nextEvent)
        }
      },
      controller.signal,
    ).catch((error: unknown) => {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }
      toast.error(error instanceof Error ? error.message : 'Không đọc được tiến trình xuất báo cáo')
    })

    return () => controller.abort()
  }, [job, onComplete, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] overflow-hidden p-0 sm:max-w-[700px]">
        <DialogHeader className="border-b px-6 py-5">
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileSpreadsheet className="size-4 text-emerald-500" />
            Xuất báo cáo lượt chạy
          </DialogTitle>
          <DialogDescription>{displayMessage}</DialogDescription>
        </DialogHeader>

        <div className="grid min-h-[300px] gap-0 bg-muted/20 md:grid-cols-[240px_1fr]">
          <aside className="border-b bg-background p-6 md:border-r md:border-b-0">
            <div className="flex flex-col gap-4">
              <StatusBadge status={currentStatus} />
              <div>
                <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
                  <span>Tiến độ</span>
                  <span>{currentProgress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary transition-all duration-300" style={{ width: `${currentProgress}%` }} />
                </div>
              </div>
              {event?.errorMessage ? (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                  {event.errorMessage}
                </div>
              ) : null}
            </div>
          </aside>

          <section className="flex min-h-[300px] flex-col justify-center overflow-auto bg-background">
            {isFinished ? (
              <JobDoneView status={currentStatus} />
            ) : (
              <JobProgressAnimation phrases={TEST_RUN_EXPORT_PHRASES} iconLabel="Export job progress" />
            )}
          </section>
        </div>

        <DialogFooter className="m-0 rounded-none p-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function StatusBadge({ status }: { status: TestRunJobResponse['status'] }) {
  if (status === 'COMPLETED') {
    return (
      <Badge className="w-fit bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
        <CheckCircle2 data-icon="inline-start" />
        Hoàn tất
      </Badge>
    )
  }
  if (status === 'FAILED') {
    return (
      <Badge variant="destructive" className="w-fit">
        <CircleX data-icon="inline-start" />
        Thất bại
      </Badge>
    )
  }
  if (status === 'CANCELLED') {
    return (
      <Badge variant="outline" className="w-fit text-muted-foreground">
        <CircleX data-icon="inline-start" />
        Đã hủy
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="w-fit">
      <Loader2 data-icon="inline-start" className="animate-spin" />
      Đang chạy
    </Badge>
  )
}

function JobDoneView({ status }: { status: TestRunJobResponse['status'] }) {
  const isSuccess = status === 'COMPLETED'
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center justify-center gap-4 p-8 text-center">
      <div className={`flex size-14 items-center justify-center rounded-full ${isSuccess ? 'bg-emerald-500/10' : 'bg-destructive/10'}`}>
        {isSuccess ? (
          <CheckCircle2 className="size-7 text-emerald-600" />
        ) : (
          <CircleAlert className="size-7 text-destructive" />
        )}
      </div>
      <div>
        <h3 className="text-base font-semibold">{isSuccess ? 'Xuất báo cáo thành công' : 'Tiến trình lỗi hoặc bị hủy'}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {isSuccess ? 'File báo cáo đã được chuẩn bị và tự động tải xuống trình duyệt.' : 'Kiểm tra thông báo lỗi bên trái.'}
        </p>
      </div>
    </div>
  )
}

function isTerminalStatus(status: TestRunJobResponse['status']): boolean {
  return status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED'
}
