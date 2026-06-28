import { Badge } from '@/components/ui/badge'
import type { TestCaseStatus, TestRunStatus } from '@/types/test-run'

const RUN_STATUS_LABELS: Record<TestRunStatus, string> = {
  QUEUED: 'Queued',
  RUNNING: 'Running',
  COMPLETED: 'Completed',
  ERROR: 'Error',
  CANCELLED: 'Cancelled',
}

const CASE_STATUS_LABELS: Record<TestCaseStatus, string> = {
  PASSED: 'Passed',
  FAILED: 'Failed',
  ERROR: 'Error',
}

export function RunStatusBadge({ status }: { status: TestRunStatus }) {
  const className =
    status === 'COMPLETED'
      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
      : status === 'RUNNING' || status === 'QUEUED'
        ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300'
        : status === 'CANCELLED'
          ? 'bg-muted text-muted-foreground'
          : 'bg-destructive/10 text-destructive'

  return <Badge className={className}>{RUN_STATUS_LABELS[status]}</Badge>
}

export function CaseStatusBadge({ status }: { status: TestCaseStatus }) {
  const className =
    status === 'PASSED'
      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
      : 'bg-destructive/10 text-destructive'

  return <Badge className={className}>{CASE_STATUS_LABELS[status]}</Badge>
}
