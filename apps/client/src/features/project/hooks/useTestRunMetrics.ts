import { useMemo } from 'react'

export interface TestRunMetrics {
  totalCases: number
  processedCases: number
  passedCases: number
  failedCases: number
  errorCases: number
  computedScore: number
  progress: number
}

export interface LatencyStats {
  min: number
  max: number
  avg: number
}

export interface RadialProps {
  radius: number
  circumference: number
  strokeDashoffset: number
}

export function useTestRunMetrics(run: any, resultsList: any[], isRunning: boolean, totalElements?: number) {
  const metrics: TestRunMetrics = useMemo(() => {
    const totalCases = run?.totalCases ?? 0
    
    const processedCases = isRunning && totalElements !== undefined
      ? totalElements
      : ((run?.passedCases ?? 0) + (run?.failedCases ?? 0) + (run?.errorCases ?? 0))
      
    const passedCases = isRunning ? resultsList.filter(c => (c.override?.overriddenStatus ?? c.status) === 'PASSED').length : (run?.passedCases ?? 0)
    const failedCases = isRunning ? resultsList.filter(c => (c.override?.overriddenStatus ?? c.status) === 'FAILED').length : (run?.failedCases ?? 0)
    const errorCases = isRunning ? resultsList.filter(c => (c.override?.overriddenStatus ?? c.status) === 'ERROR').length : (run?.errorCases ?? 0)
    
    const computedScore = isRunning 
      ? (processedCases > 0 ? passedCases / processedCases : 0) 
      : (run?.score ?? 0)

    const progress = totalCases > 0 ? Math.round((processedCases / totalCases) * 100) : 0

    return {
      totalCases,
      processedCases,
      passedCases,
      failedCases,
      errorCases,
      computedScore,
      progress
    }
  }, [run, resultsList, isRunning, totalElements])

  const latencyStats: LatencyStats = useMemo(() => {
    const list = resultsList ?? []
    if (list.length === 0) return { min: 0, max: 0, avg: 0 }
    const validLatencies = list
      .map((r) => r.latencyMs)
      .filter((l): l is number => typeof l === 'number' && l > 0)
    if (validLatencies.length === 0) return { min: 0, max: 0, avg: 0 }

    const min = Math.min(...validLatencies)
    const max = Math.max(...validLatencies)
    const sum = validLatencies.reduce((a, b) => a + b, 0)
    const avg = Math.round(sum / validLatencies.length)

    return { min, max, avg }
  }, [resultsList])

  const radialProps: RadialProps = useMemo(() => {
    const radius = 36
    const circumference = 2 * Math.PI * radius
    const scoreVal = metrics.computedScore
    const strokeDashoffset = circumference - scoreVal * circumference
    return { radius, circumference, strokeDashoffset }
  }, [metrics.computedScore])

  return { metrics, latencyStats, radialProps }
}
