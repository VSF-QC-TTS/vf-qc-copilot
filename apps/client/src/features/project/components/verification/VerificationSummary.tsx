import type { ReactElement } from 'react'

import type { VerificationItemRequest } from '@/types/config'

import { Badge } from '@/components/ui/badge'

interface VerificationSummaryProps {
  items: VerificationItemRequest[]
  threshold: number
}

export function VerificationSummary({ items, threshold }: VerificationSummaryProps): ReactElement {
  const enabledItems = items.filter((item) => item.enabled)
  const criticalItems = enabledItems.filter((item) => item.critical)
  const totalWeight = enabledItems.reduce((sum, item) => sum + Number(item.weight || 0), 0)

  return (
    <div className="grid gap-2 sm:grid-cols-4">
      <SummaryTile label="Đang bật" value={String(enabledItems.length)} />
      <SummaryTile label="Bắt buộc đúng" value={String(criticalItems.length)} />
      <SummaryTile label="Tổng ảnh hưởng" value={totalWeight.toFixed(1)} />
      <SummaryTile label="Ngưỡng đạt tổng" value={threshold.toFixed(2)} />
    </div>
  )
}

function SummaryTile({ label, value }: { label: string; value: string }): ReactElement {
  return (
    <div className="rounded-xl border bg-card px-3 py-2">
      <div className="text-[11px] font-medium text-muted-foreground">{label}</div>
      <Badge variant="secondary" className="mt-1 rounded-full font-mono">
        {value}
      </Badge>
    </div>
  )
}
