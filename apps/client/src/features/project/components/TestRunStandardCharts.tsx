import { useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell as ChartCell,
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

import type { TestResultResponse } from '@/types/test-run'

interface TestRunStandardChartsProps {
  results: TestResultResponse[]
}

const PIE_COLORS = {
  Passed: '#111111',
  Failed: '#9F2F2D',
  Error: '#D97706',
}

export function TestRunStandardCharts({ results }: TestRunStandardChartsProps) {
  const chartData = useMemo(() => {
    if (!results || results.length === 0) return null

    let passed = 0
    let failed = 0
    let error = 0

    const latencyData: any[] = []

    results.forEach((r) => {
      if (r.status === 'ERROR') error++
      else if (r.passed) passed++
      else failed++

      latencyData.push({
        name: `Case ${r.caseIndex + 1}`,
        latency: r.latencyMs || 0,
        passed: r.passed,
      })
    })

    const pieData = [
      { name: 'Passed', value: passed },
      { name: 'Failed', value: failed },
      { name: 'Error', value: error },
    ].filter(d => d.value > 0)

    return {
      pieData,
      latencyData,
    }
  }, [results])

  if (!chartData) return null

  return (
    <div className="grid gap-6 md:grid-cols-3 mb-12 mt-8">
      {/* Pie Chart Container */}
      <div className="border border-[#EAEAEA] bg-white rounded-lg flex flex-col hover:shadow-sm transition-all duration-300 overflow-hidden col-span-1">
        <div className="p-5 pb-3 border-b border-[#EAEAEA] bg-[#FAFAFA]">
          <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Tỉ lệ Pass / Fail</h3>
        </div>
        <div className="p-5 h-[300px] w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={chartData.pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {chartData.pieData.map((entry, index) => (
                  <ChartCell key={`cell-${index}`} fill={PIE_COLORS[entry.name as keyof typeof PIE_COLORS]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '6px', border: '1px solid #EAEAEA', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', fontSize: '12px' }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Latency Chart Container */}
      <div className="border border-[#EAEAEA] bg-white rounded-lg flex flex-col hover:shadow-sm transition-all duration-300 overflow-hidden col-span-2">
        <div className="p-5 pb-3 border-b border-[#EAEAEA] bg-[#FAFAFA]">
          <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Tốc độ phản hồi (Latency)</h3>
        </div>
        <div className="p-5 h-[300px] w-full">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData.latencyData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F2F2F2" />
              <XAxis dataKey="name" tick={{ fill: '#787774', fontSize: 10 }} axisLine={false} tickLine={false} tickMargin={10} minTickGap={20} />
              <YAxis tick={{ fill: '#787774', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: '#F7F6F3' }}
                contentStyle={{ borderRadius: '6px', border: '1px solid #EAEAEA', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', fontSize: '12px', padding: '10px 14px' }}
                formatter={(value: any) => [`${value} ms`, 'Độ trễ']}
              />
              <Bar dataKey="latency" radius={[3, 3, 0, 0]} maxBarSize={20}>
                {chartData.latencyData.map((entry, index) => (
                  <ChartCell key={`cell-${index}`} fill={entry.passed ? '#111111' : '#9F2F2D'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
