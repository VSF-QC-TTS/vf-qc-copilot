import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

/**
 * Skeleton cho DatasetSchemaPage:
 * - Header + Add button
 * - Table with 4 placeholder rows
 */
export function DatasetSchemaSkeleton() {
  return (
    <div className="flex flex-col gap-6 max-w-[900px] mx-auto w-full p-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Skeleton className="h-7 w-[200px] mb-2" />
          <Skeleton className="h-4 w-[320px]" />
        </div>
        <Skeleton className="h-9 w-[120px] rounded-md" />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {/* Header row */}
          <div className="flex items-center gap-4 px-4 py-3 border-b">
            <Skeleton className="h-4 w-6" />
            <Skeleton className="h-4 w-[120px]" />
            <Skeleton className="h-4 w-[70px] ml-auto" />
            <Skeleton className="h-4 w-[90px]" />
            <Skeleton className="h-4 w-[60px]" />
            <Skeleton className="h-4 w-[60px]" />
          </div>
          {/* Data rows */}
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b last:border-0">
              <Skeleton className="h-4 w-4 rounded" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-[140px]" />
                <Skeleton className="h-3 w-[100px]" />
              </div>
              <Skeleton className="h-4 w-[50px]" />
              <Skeleton className="h-5 w-[80px] rounded-full" />
              <Skeleton className="h-2 w-2 rounded-full" />
              <Skeleton className="h-6 w-[50px]" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
