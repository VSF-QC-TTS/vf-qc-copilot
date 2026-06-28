import { Badge } from '@/components/ui/badge'
import type { TestCaseStatus, TestRunStatus } from '@/types/test-run'
import {
  ClockIcon,
  Loader2Icon,
  CheckIcon,
  AlertCircleIcon,
  BanIcon,
  XCircleIcon,
} from 'lucide-react'

const RUN_STATUS_LABELS: Record<TestRunStatus, string> = {
  QUEUED: 'Đang chờ',
  RUNNING: 'Đang chạy',
  COMPLETED: 'Hoàn thành',
  ERROR: 'Lỗi hệ thống',
  CANCELLED: 'Đã hủy',
}

const CASE_STATUS_LABELS: Record<TestCaseStatus, string> = {
  PASSED: 'Đạt',
  FAILED: 'Không đạt',
  ERROR: 'Lỗi',
}

export function RunStatusBadge({ status }: { status: TestRunStatus }) {
  const className =
    status === 'COMPLETED'
      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
      : status === 'RUNNING'
        ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300'
        : status === 'QUEUED'
          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
          : status === 'CANCELLED'
            ? 'bg-muted text-muted-foreground'
            : 'bg-destructive/10 text-destructive'

  const renderIcon = () => {
    switch (status) {
      case 'COMPLETED':
        return <CheckIcon />
      case 'RUNNING':
        return <Loader2Icon className="animate-spin" />
      case 'QUEUED':
        return <ClockIcon />
      case 'CANCELLED':
        return <BanIcon />
      case 'ERROR':
      default:
        return <AlertCircleIcon />
    }
  }

  return (
    <Badge className={className}>
      {renderIcon()}
      <span>{RUN_STATUS_LABELS[status]}</span>
    </Badge>
  )
}

export function CaseStatusBadge({ status }: { status: TestCaseStatus }) {
  const className =
    status === 'PASSED'
      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
      : 'bg-destructive/10 text-destructive'

  const renderIcon = () => {
    switch (status) {
      case 'PASSED':
        return <CheckIcon />
      case 'FAILED':
        return <XCircleIcon />
      case 'ERROR':
      default:
        return <AlertCircleIcon />
    }
  }

  return (
    <Badge className={className}>
      {renderIcon()}
      <span>{CASE_STATUS_LABELS[status]}</span>
    </Badge>
  )
}

