import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts'

import type { TestResultResponse } from '@/types/test-run'

interface TestRunCompareChartsProps {
  results: TestResultResponse[]
}

// Minimalist editorial color palette
const COLORS = [
  '#111111', // Dark Charcoal (Target)
  '#787774', // Muted Gray
  '#9F2F2D', // Pale Red (dark enough for contrast)
  '#1F6C9F', // Pale Blue
  '#346538', // Pale Green
]

export function TestRunCompareCharts({ results }: TestRunCompareChartsProps) {
  const chartData = useMemo(() => {
    if (!results || results.length === 0) return null

    // Initialize stats
    const statsMap = new Map<
      string,
      {
        name: string
        passCount: number
        totalCount: number
        totalScore: number
        latencies: number[] // Latency only available for Target currently
      }
    >()

    // Target model
    statsMap.set('Target', {
      name: 'Chatbot Nội bộ',
      passCount: 0,
      totalCount: 0,
      totalScore: 0,
      latencies: [],
    })

    results.forEach((r) => {
      // Target update
      const targetStat = statsMap.get('Target')!
      targetStat.totalCount++
      if (r.passed) targetStat.passCount++
      targetStat.totalScore += r.score ?? 0
      if (r.latencyMs) targetStat.latencies.push(r.latencyMs)

      // Compare update
      const compareAssertions = r.assertions.filter((a) => a.assertionType === 'LLM_COMPARE')
      compareAssertions.forEach((a) => {
        const name = a.assertionName || 'Unknown'
        if (!statsMap.has(name)) {
          statsMap.set(name, {
            name,
            passCount: 0,
            totalCount: 0,
            totalScore: 0,
            latencies: [],
          })
        }
        const s = statsMap.get(name)!
        s.totalCount++
        if (a.passed) s.passCount++
        s.totalScore += a.score ?? 0
      })
    })

    // Prepare data for recharts
    const barData: any[] = []
    const radarData: any[] = [] // if we want to show multiple dimensions, like Pass Rate vs Score

    statsMap.forEach((stat) => {
      const passRate = stat.totalCount > 0 ? (stat.passCount / stat.totalCount) * 100 : 0
      const avgScore = stat.totalCount > 0 ? (stat.totalScore / stat.totalCount) * 100 : 0

      barData.push({
        name: stat.name,
        'Pass Rate (%)': Number(passRate.toFixed(1)),
        'Avg Score (%)': Number(avgScore.toFixed(1)),
      })
    })

    // Transpose for Radar (metrics as corners)
    const metrics = ['Pass Rate (%)', 'Avg Score (%)']
    metrics.forEach((metric) => {
      const point: any = { metric }
      barData.forEach((d) => {
        point[d.name] = d[metric]
      })
      radarData.push(point)
    })

    return {
      barData,
      radarData,
      models: Array.from(statsMap.values()).map((s) => s.name),
    }
  }, [results])

  if (!chartData) return null

  return (
    <div className="grid gap-6 md:grid-cols-2 mb-16 mt-8">
      {/* Bar Chart Container */}
      <div className="border border-[#EAEAEA] bg-white rounded-md flex flex-col hover:shadow-[0_4px_20px_rgb(0,0,0,0.02)] transition-shadow duration-300">
        <div className="p-6 pb-2 border-b border-[#EAEAEA]">
          <h3 className="text-xs font-bold text-[#787774] uppercase tracking-widest">Biểu đồ so sánh điểm số</h3>
        </div>
        <div className="p-6 h-[300px] w-full">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData.barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: '#787774', fontSize: 11, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#787774', fontSize: 11, fontFamily: 'monospace' }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip
                cursor={{ fill: '#F7F6F3' }}
                contentStyle={{ borderRadius: '4px', border: '1px solid #EAEAEA', boxShadow: 'none', fontSize: '13px', fontFamily: 'monospace' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px', fontFamily: 'sans-serif' }} iconType="circle" />
              <Bar dataKey="Pass Rate (%)" fill={COLORS[0]} radius={[2, 2, 0, 0]} maxBarSize={40} />
              <Bar dataKey="Avg Score (%)" fill={COLORS[2]} radius={[2, 2, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Radar Chart Container */}
      <div className="border border-[#EAEAEA] bg-white rounded-md flex flex-col hover:shadow-[0_4px_20px_rgb(0,0,0,0.02)] transition-shadow duration-300">
        <div className="p-6 pb-2 border-b border-[#EAEAEA]">
          <h3 className="text-xs font-bold text-[#787774] uppercase tracking-widest">Phân tích đa chiều</h3>
        </div>
        <div className="p-6 h-[300px] w-full">
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData.radarData}>
              <PolarGrid stroke="#EAEAEA" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#111111', fontSize: 11, fontWeight: 'bold' }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#787774', fontSize: 10 }} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: '4px', border: '1px solid #EAEAEA', boxShadow: 'none', fontSize: '13px', fontFamily: 'monospace' }} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px', fontFamily: 'sans-serif' }} iconType="circle" />
              {chartData.models.map((model, index) => (
                <Radar
                  key={model}
                  name={model}
                  dataKey={model}
                  stroke={COLORS[index % COLORS.length]}
                  fill={COLORS[index % COLORS.length]}
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              ))}
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
