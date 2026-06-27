import { BrainCircuitIcon, ListChecksIcon, PlusIcon, Rows3Icon } from 'lucide-react'
import type { ReactElement } from 'react'

import type { VerificationMode } from '@/types/config'

import { Button } from '@/components/ui/button'

interface VerificationItemToolbarProps {
  mode: VerificationMode
  onAddField: () => void
  onAddGroup: () => void
  onAddLlm: () => void
}

export function VerificationItemToolbar({
  mode,
  onAddField,
  onAddGroup,
  onAddLlm,
}: VerificationItemToolbarProps): ReactElement {
  const showFieldActions = mode === 'FIELD_CHECKS' || mode === 'COMBINED'
  const showLlmAction = mode === 'LLM_JUDGE' || mode === 'COMBINED'

  return (
    <div className="flex flex-wrap gap-2">
      {showFieldActions ? (
        <>
          <Button type="button" variant="outline" size="sm" className="h-9 rounded-lg" onClick={onAddField}>
            <ListChecksIcon className="size-4" />
            Kiểm tra một trường
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-9 rounded-lg" onClick={onAddGroup}>
            <Rows3Icon className="size-4" />
            Kiểm tra nhiều trường
          </Button>
        </>
      ) : null}
      {showLlmAction ? (
        <Button type="button" variant="outline" size="sm" className="h-9 rounded-lg" onClick={onAddLlm}>
          <BrainCircuitIcon className="size-4" />
          AI chấm theo tiêu chí
        </Button>
      ) : null}
      {!showFieldActions && !showLlmAction ? (
        <Button type="button" variant="outline" size="sm" className="h-9 rounded-lg" disabled>
          <PlusIcon className="size-4" />
          Chọn chế độ
        </Button>
      ) : null}
    </div>
  )
}
