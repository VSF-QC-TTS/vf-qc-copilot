import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export function ProjectSchemaSkeleton() {
  return (
    <div className="flex flex-col gap-6 max-w-[900px] mx-auto w-full p-6">
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-[400px]" />
        </div>
        <Skeleton className="h-9 w-28 shrink-0" />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="border-b p-3">
            <div className="flex items-center gap-4 px-2">
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20 ml-auto" />
            </div>
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 p-3 border-b last:border-0">
              <Skeleton className="h-4 w-4 shrink-0 mx-3" />
              <div className="flex flex-col gap-1 w-40">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-5 w-16 rounded-md" />
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-4 w-4 rounded-full mx-auto" />
              <div className="flex gap-2 ml-auto pr-2">
                <Skeleton className="h-7 w-7 rounded-md" />
                <Skeleton className="h-7 w-7 rounded-md" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
