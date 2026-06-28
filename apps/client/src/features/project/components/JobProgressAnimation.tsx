import { BrandedLoading } from '@/components/BrandedLoading'

interface JobProgressAnimationProps {
  phrases: readonly string[]
  iconLabel?: string
}

export function JobProgressAnimation({ phrases }: JobProgressAnimationProps) {
  return <BrandedLoading phrases={phrases} />
}
