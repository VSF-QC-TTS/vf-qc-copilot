import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function AiConfigSkeleton() {
  return (
    <div className="flex flex-col gap-8 max-w-[1200px] mx-auto w-full p-6">
      {/* Header */}
      <div className="flex items-center gap-4 border-b pb-5">
        <Skeleton className="size-10 rounded-xl" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-[350px]" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Main Configuration */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <Card>
            <CardHeader className="pb-4 border-b border-border/40 mb-4">
              <Skeleton className="h-5 w-48" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
                <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-3 w-64 mt-1" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-10 w-full" /></div>
                <div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-10 w-full" /></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Parameters & Actions */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <Card className="bg-muted/30 border-border/60">
            <CardHeader className="pb-3 border-b border-border/40 mb-4 bg-background/50 rounded-t-xl">
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Skeleton className="h-3 w-16" /><Skeleton className="h-9 w-full" /></div>
                <div className="space-y-2"><Skeleton className="h-3 w-16" /><Skeleton className="h-9 w-full" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Skeleton className="h-3 w-16" /><Skeleton className="h-9 w-full" /></div>
                <div className="space-y-2"><Skeleton className="h-3 w-16" /><Skeleton className="h-9 w-full" /></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20 shadow-sm">
            <CardContent className="p-5 flex flex-col gap-4">
              <Skeleton className="h-3 w-full" />
              <div className="flex flex-col gap-2.5">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
