import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Scatter,
  ScatterChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from 'recharts'

import type { TestResultResponse } from '@/types/test-run'

interface TestRunCompareChartsProps {
  results: TestResultResponse[]
}

// Minimalist editorial color palette
const COLORS = [
  '#111111', // Dark Charcoal (Target)
  '#4A4A4A', // Mid Gray
  '#8B8B8B', // Light Gray
  '#2C5282', // Muted Blue
  '#276749', // Muted Green
]

export function TestRunCompareCharts({ results }: TestRunCompareChartsProps) {
  const chartData = useMemo(() => {
    if (!results || results.length === 0) return null

    const statsMap = new Map<
      string,
      {
        name: string
        passCount: number
        totalCount: number
        totalScore: number
      }
    >()

    statsMap.set('Target', {
      name: 'Chatbot Nội bộ',
      passCount: 0,
      totalCount: 0,
      totalScore: 0,
    })

    results.forEach((r) => {
      const targetStat = statsMap.get('Target')!
      targetStat.totalCount++
      if (r.passed) targetStat.passCount++
      targetStat.totalScore += r.score ?? 0

      const compareAssertions = r.assertions.filter((a) => a.assertionType === 'LLM_COMPARE')
      compareAssertions.forEach((a) => {
        const name = a.assertionName || 'Unknown'
        if (!statsMap.has(name)) {
          statsMap.set(name, {
            name,
            passCount: 0,
            totalCount: 0,
            totalScore: 0,
          })
        }
        const s = statsMap.get(name)!
        s.totalCount++
        if (a.passed) s.passCount++
        s.totalScore += a.score ?? 0
      })
    })

    const barData: any[] = []
    const scatterData: any[] = []

    let i = 0
    statsMap.forEach((stat) => {
      const passRate = stat.totalCount > 0 ? (stat.passCount / stat.totalCount) * 100 : 0
      const avgScore = stat.totalCount > 0 ? (stat.totalScore / stat.totalCount) * 100 : 0

      barData.push({
        name: stat.name,
        'Pass Rate (%)': Number(passRate.toFixed(1)),
        'Avg Score (%)': Number(avgScore.toFixed(1)),
      })

      scatterData.push({
        name: stat.name,
        x: Number(passRate.toFixed(1)),
        y: Number(avgScore.toFixed(1)),
        fill: COLORS[i % COLORS.length],
      })
      i++
    })

    return {
      barData,
      scatterData,
      models: Array.from(statsMap.values()).map((s) => s.name),
    }
  }, [results])

  if (!chartData) return null

  return (
    <div className="grid gap-6 md:grid-cols-2 mb-12 mt-8">
      {/* Bar Chart Container */}
      <div className="border border-[#EAEAEA] bg-white rounded-lg flex flex-col hover:shadow-sm transition-all duration-300 overflow-hidden">
        <div className="p-5 pb-3 border-b border-[#EAEAEA] bg-[#FAFAFA]">
          <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Hiệu năng LLM</h3>
        </div>
        <div className="p-5 h-[300px] w-full">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData.barData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F2F2F2" />
              <XAxis dataKey="name" tick={{ fill: '#787774', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} tickMargin={10} />
              <YAxis tick={{ fill: '#787774', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip
                cursor={{ fill: '#F7F6F3' }}
                contentStyle={{ borderRadius: '6px', border: '1px solid #EAEAEA', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', fontSize: '12px', padding: '10px 14px' }}
                itemStyle={{ fontSize: '11px', fontWeight: 600 }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '15px', fontWeight: 500 }} iconType="circle" iconSize={8} />
              <Bar dataKey="Pass Rate (%)" fill="#111111" radius={[3, 3, 0, 0]} maxBarSize={32} />
              <Bar dataKey="Avg Score (%)" fill="#999999" radius={[3, 3, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Scatter Chart Container */}
      <div className="border border-[#EAEAEA] bg-white rounded-lg flex flex-col hover:shadow-sm transition-all duration-300 overflow-hidden">
        <div className="p-5 pb-3 border-b border-[#EAEAEA] bg-[#FAFAFA]">
          <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Ma trận A/B Testing</h3>
        </div>
        <div className="p-5 h-[300px] w-full relative">
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F2F2F2" />
              <XAxis 
                type="number" 
                dataKey="x" 
                name="Pass Rate" 
                domain={[0, 100]} 
                tick={{ fontSize: 10, fill: '#787774', fontFamily: 'monospace' }} 
                axisLine={false} 
                tickLine={false} 
                label={{ value: 'Tỷ lệ Pass (%)', position: 'insideBottom', offset: -15, fontSize: 10, fill: '#787774', fontWeight: 500 }} 
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name="Avg Score" 
                domain={[0, 100]} 
                tick={{ fontSize: 10, fill: '#787774', fontFamily: 'monospace' }} 
                axisLine={false} 
                tickLine={false} 
                label={{ value: 'Điểm số (%)', angle: -90, position: 'insideLeft', offset: 10, fontSize: 10, fill: '#787774', fontWeight: 500 }} 
              />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }} 
                contentStyle={{ borderRadius: '6px', border: '1px solid #EAEAEA', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', fontSize: '12px' }} 
              />
              {/* Highlight the top-right "Magic Quadrant" for perfect models (score > 80, pass > 80) */}
              <ReferenceLine x={80} stroke="#EAEAEA" strokeDasharray="3 3" />
              <ReferenceLine y={80} stroke="#EAEAEA" strokeDasharray="3 3" />
              
              {chartData.scatterData.map((s) => (
                <Scatter key={s.name} name={s.name} data={[s]} fill={s.fill} shape="circle" r={40} />
              ))}
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '15px', fontWeight: 500 }} iconType="circle" iconSize={8} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
