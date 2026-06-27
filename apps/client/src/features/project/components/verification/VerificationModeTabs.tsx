import { BrainCircuitIcon, CombineIcon, ListChecksIcon } from 'lucide-react'
import type { ElementType, ReactElement } from 'react'

import type { VerificationMode } from '@/types/config'

import { MODE_OPTIONS } from './verification-form'

interface VerificationModeTabsProps {
  value: VerificationMode
  onChange: (mode: VerificationMode) => void
}

const MODE_ICONS: Record<VerificationMode, ElementType> = {
  FIELD_CHECKS: ListChecksIcon,
  LLM_JUDGE: BrainCircuitIcon,
  COMBINED: CombineIcon,
}

export function VerificationModeTabs({ value, onChange }: VerificationModeTabsProps): ReactElement {
  return (
    <div className="grid gap-2 md:grid-cols-3">
      {MODE_OPTIONS.map((mode) => {
        const Icon = MODE_ICONS[mode.value]
        const active = value === mode.value
        return (
          <button
            key={mode.value}
            type="button"
            onClick={() => onChange(mode.value)}
            className={`rounded-xl border px-4 py-3 text-left transition active:scale-[0.99] ${
              active
                ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                : 'bg-card text-foreground hover:bg-muted/50'
            }`}
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Icon className="size-4" />
              {mode.label}
            </span>
            <span className={`mt-1 block text-xs ${active ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
              {mode.description}
            </span>
          </button>
        )
      })}
    </div>
  )
}
