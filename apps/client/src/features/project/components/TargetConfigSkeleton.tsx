import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

/**
 * Skeleton cho TargetConfigPage:
 * - Header
 * - CurlImportCard (textarea + button)
 */
export function TargetConfigSkeleton() {
  return (
    <div className="flex flex-col gap-6 max-w-[900px] mx-auto w-full p-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <Skeleton className="h-7 w-[220px] mb-2" />
        <Skeleton className="h-4 w-[340px]" />
      </div>

      {/* cURL Import Card */}
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-[160px]" />
          <Skeleton className="h-4 w-[280px] mt-1" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-[120px] w-full rounded-md" />
          <div className="flex justify-end">
            <Skeleton className="h-9 w-[140px] rounded-md" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
