import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

/**
 * Skeleton cho VerificationConfigPage:
 * - Header
 * - Single card with mode selector + table rows
 */
export function VerificationSkeleton() {
  return (
    <div className="flex flex-col gap-6 max-w-[900px] mx-auto w-full p-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <Skeleton className="h-7 w-[240px] mb-2" />
        <Skeleton className="h-4 w-[400px]" />
      </div>

      {/* Config Card */}
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-[160px]" />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mode selector */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-[120px]" />
            <Skeleton className="h-10 w-[280px] rounded-md" />
            <Skeleton className="h-3 w-[240px]" />
          </div>

          <Skeleton className="h-px w-full" />

          {/* Section header */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-[160px]" />
            <Skeleton className="h-8 w-[120px] rounded-md" />
          </div>

          {/* Table rows */}
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-2">
              <Skeleton className="h-4 w-[160px]" />
              <Skeleton className="h-4 w-[80px]" />
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-[40px] ml-auto" />
              <Skeleton className="h-6 w-[50px]" />
            </div>
          ))}

          <Skeleton className="h-px w-full" />

          {/* Actions */}
          <div className="flex justify-end">
            <Skeleton className="h-9 w-[120px] rounded-md" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
