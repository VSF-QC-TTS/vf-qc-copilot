import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function ConfigPageSkeleton() {
  return (
    <div className="flex flex-col gap-6 max-w-[900px] mx-auto w-full p-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <Skeleton className="h-7 w-[220px] mb-2" />
        <Skeleton className="h-4 w-[360px]" />
      </div>

      {/* Config Card */}
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-[180px]" />
        </CardHeader>
        <CardContent className="space-y-5">
          {/* 2-column row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-[80px]" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-[60px]" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </div>
          {/* Full-width field */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-[70px]" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          {/* Collapsible trigger */}
          <Skeleton className="h-4 w-[140px]" />
          {/* Actions bar */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t">
            <Skeleton className="h-9 w-[90px] rounded-md" />
            <Skeleton className="h-9 w-[70px] rounded-md" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
