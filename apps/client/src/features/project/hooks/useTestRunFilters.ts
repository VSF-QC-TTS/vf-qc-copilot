import { useMemo } from 'react'

export type StatusFilter = 'ALL' | 'PASSED' | 'FAILED' | 'ERROR'
export type SortBy = 'index' | 'latency'

export function useTestRunFilters(
  resultsList: any[],
  searchQuery: string,
  statusFilter: StatusFilter,
  sortBy: SortBy
) {
  const filteredCases = useMemo(() => {
    let list = [...(resultsList ?? [])]

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter((item) => {
        const inputMatch = item.inputData?.toLowerCase().includes(q)
        const outputMatch = item.actualOutput?.toLowerCase().includes(q)
        const assertionMatch = item.assertions?.some(
          (a: any) => a.reason?.toLowerCase().includes(q) || a.assertionName?.toLowerCase().includes(q)
        )
        return inputMatch || outputMatch || assertionMatch
      })
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      list = list.filter((item) => item.status === statusFilter)
    }

    // Sort order
    if (sortBy === 'latency') {
      list.sort((a, b) => (b.latencyMs ?? 0) - (a.latencyMs ?? 0))
    } else {
      list.sort((a, b) => a.caseIndex - b.caseIndex)
    }

    return list
  }, [resultsList, searchQuery, statusFilter, sortBy])

  return { filteredCases }
}
