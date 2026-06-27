import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function TargetConfigSkeleton() {
  return (
    <div className="flex flex-col gap-6 max-w-[1200px] mx-auto w-full p-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4 border-b pb-5">
        <Skeleton className="size-10 rounded-xl" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-[350px]" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: cURL Setup */}
        <div className="lg:col-span-7 flex flex-col gap-6">
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

        {/* Right Column: Connection Status & Response Path (Placeholder) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <Card className="border-l-4 border-l-muted">
            <CardContent className="flex items-center gap-4 py-4 px-5">
               <Skeleton className="size-10 rounded-full shrink-0" />
               <div className="flex flex-col gap-2 w-full">
                  <Skeleton className="h-4 w-[140px]" />
                  <Skeleton className="h-3 w-full" />
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
