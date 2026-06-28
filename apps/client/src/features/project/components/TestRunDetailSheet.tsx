import { BanIcon, ClockIcon, ListChecksIcon, TimerIcon, type LucideIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { isRunActive, useCancelTestRun, useTestRun, useTestRunEvents, useTestRunResults } from '../hooks/use-test-runs'
import { CaseStatusBadge, RunStatusBadge } from './RunStatusBadge'
import type { RunEventResponse, TestResultResponse, TestRunResponse } from '@/types/test-run'

interface TestRunDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectPublicId: string | undefined
  run: TestRunResponse | null
}

export function TestRunDetailSheet({
  open,
  onOpenChange,
  projectPublicId,
  run: initialRun,
}: TestRunDetailSheetProps) {
  const runPublicId = initialRun?.publicId
  const liveRun = useTestRun(runPublicId, isRunActive(initialRun ?? undefined))
  const run = liveRun.data ?? initialRun
  const poll = isRunActive(run ?? undefined)
  const results = useTestRunResults(runPublicId, poll)
  const events = useTestRunEvents(runPublicId, poll)
  const cancelRun = useCancelTestRun(projectPublicId)

  const processedCases = (run?.passedCases ?? 0) + (run?.failedCases ?? 0) + (run?.errorCases ?? 0)
  const totalCases = run?.totalCases ?? 0
  const progress = totalCases > 0 ? Math.round((processedCases / totalCases) * 100) : 0
  const canCancel = run?.status === 'QUEUED' || run?.status === 'RUNNING'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-4xl">
        <SheetHeader className="border-b">
          <div className="flex flex-col gap-3 pr-8 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <SheetTitle className="truncate">{run?.name ?? 'Test run'}</SheetTitle>
              <SheetDescription>
                {run?.createdAt ? new Date(run.createdAt).toLocaleString('vi-VN') : 'Đang tải...'}
              </SheetDescription>
            </div>
            {run ? <RunStatusBadge status={run.status} /> : null}
          </div>
        </SheetHeader>

        {!run ? (
          <div className="grid gap-3 p-4">
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-80 rounded-lg" />
          </div>
        ) : (
          <div className="grid gap-4 p-4">
            <div className="grid gap-3 md:grid-cols-4">
              <MetricCard icon={ListChecksIcon} label="Cases" value={`${processedCases}/${totalCases}`} />
              <MetricCard icon={ClockIcon} label="Score" value={formatScore(run.score)} />
              <MetricCard icon={TimerIcon} label="Duration" value={formatDuration(run.durationMs)} />
              <MetricCard icon={ListChecksIcon} label="Version" value={`v${run.datasetVersionNumber}`} />
            </div>

            <Card>
              <CardContent className="p-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium">Progress</span>
                  <span className="text-muted-foreground">{progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">Passed {run.passedCases}</Badge>
                  <Badge variant="outline">Failed {run.failedCases}</Badge>
                  <Badge variant="outline">Error {run.errorCases}</Badge>
                  {run.errorMessage ? <Badge variant="destructive">{run.errorMessage}</Badge> : null}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={!canCancel || cancelRun.isPending}
                onClick={() => runPublicId && cancelRun.mutate(runPublicId)}
              >
                <BanIcon data-icon="inline-start" />
                Hủy run
              </Button>
            </div>

            <section className="grid gap-3">
              <h3 className="text-sm font-semibold">Results</h3>
              <ResultsTable results={results.data?.content ?? []} isLoading={results.isLoading} />
            </section>

            <section className="grid gap-3">
              <h3 className="text-sm font-semibold">Events</h3>
              <EventList events={events.data ?? []} isLoading={events.isLoading} />
            </section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="rounded-lg bg-muted/50 p-2 text-primary">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <div className="truncate font-mono text-lg font-semibold">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function ResultsTable({ results, isLoading }: { results: TestResultResponse[]; isLoading: boolean }) {
  if (isLoading) {
    return <Skeleton className="h-48 rounded-lg" />
  }

  if (results.length === 0) {
    return <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">Chưa có result.</div>
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Case</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Latency</TableHead>
            <TableHead>Assertions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((result) => (
            <TableRow key={result.publicId} className="align-top">
              <TableCell className="font-mono">#{result.caseIndex}</TableCell>
              <TableCell>
                <CaseStatusBadge status={result.status} />
              </TableCell>
              <TableCell>{formatScore(result.score)}</TableCell>
              <TableCell>{formatDuration(result.latencyMs)}</TableCell>
              <TableCell className="min-w-[320px] whitespace-normal">
                <div className="grid gap-2">
                  {result.assertions.length === 0 ? (
                    <span className="text-xs text-muted-foreground">Không có assertion detail.</span>
                  ) : (
                    result.assertions.map((assertion) => (
                      <div key={assertion.publicId} className="rounded-md border bg-muted/20 p-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={assertion.passed ? 'outline' : 'destructive'}>
                            {assertion.passed ? 'Pass' : 'Fail'}
                          </Badge>
                          <span className="font-mono text-xs">{assertion.responsePath ?? assertion.assertionName}</span>
                        </div>
                        {assertion.reason ? (
                          <div className="mt-1 text-xs text-muted-foreground">{assertion.reason}</div>
                        ) : null}
                      </div>
                    ))
                  )}
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground">Input / output</summary>
                    <pre className="mt-2 max-h-56 overflow-auto rounded-md bg-muted/40 p-3 whitespace-pre-wrap break-words">
                      {formatJsonBlock({ input: result.inputData, output: result.actualOutput })}
                    </pre>
                  </details>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function EventList({ events, isLoading }: { events: RunEventResponse[]; isLoading: boolean }) {
  if (isLoading) {
    return <Skeleton className="h-32 rounded-lg" />
  }

  if (events.length === 0) {
    return <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">Chưa có event.</div>
  }

  return (
    <div className="grid gap-2">
      {events.map((event) => (
        <div key={event.publicId} className="rounded-lg border p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-xs font-medium">{event.eventType}</span>
            <span className="text-xs text-muted-foreground">{new Date(event.createdAt).toLocaleString('vi-VN')}</span>
          </div>
          {event.payload ? (
            <pre className="mt-2 max-h-32 overflow-auto rounded-md bg-muted/30 p-2 text-xs whitespace-pre-wrap break-words">
              {prettyJson(event.payload)}
            </pre>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function formatScore(value: number | null): string {
  return value == null ? '-' : `${Math.round(value * 100)}%`
}

function formatDuration(value: number | null): string {
  if (value == null) {
    return '-'
  }
  return value < 1000 ? `${value}ms` : `${(value / 1000).toFixed(1)}s`
}

function prettyJson(value: string): string {
  try {
    return JSON.stringify(JSON.parse(value), null, 2)
  } catch {
    return value
  }
}

function formatJsonBlock(value: Record<string, string | null>): string {
  return JSON.stringify(
    Object.fromEntries(Object.entries(value).map(([key, item]) => [key, item ? tryParseJson(item) : null])),
    null,
    2,
  )
}

function tryParseJson(value: string): unknown {
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}
