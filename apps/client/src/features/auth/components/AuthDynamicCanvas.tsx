import { motion } from "motion/react"

export function AuthDynamicCanvas() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-zinc-50 dark:bg-zinc-950">
      {/* Dot Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.3] dark:opacity-[0.15]" 
        style={{ 
          backgroundImage: 'radial-gradient(circle at center, #71717a 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }} 
      />

      {/* Subtle Glowing Orbs */}
      <div className="absolute top-[10%] left-[10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px]" />
      <div className="absolute bottom-[10%] right-[10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px]" />

      {/* 3D Perspective Container */}
      <div className="absolute inset-0 hidden items-center justify-center opacity-40 dark:opacity-60 md:flex" style={{ perspective: "1200px" }}>
        
        {/* Left Widget: Prompt Test Matrix (promptfoo-style) */}
        <motion.div
          initial={{ opacity: 0, x: -100, rotateY: 30, rotateX: 10, scale: 0.9 }}
          animate={{ 
            opacity: 1, 
            x: -280, 
            y: [-20, -30, -20],
            rotateY: [35, 30, 35], 
            rotateX: [10, 15, 10],
            scale: 1
          }}
          transition={{ 
            opacity: { duration: 1.5, ease: "easeOut" },
            x: { duration: 1.5, ease: "easeOut" },
            scale: { duration: 1.5, ease: "easeOut" },
            y: { duration: 8, repeat: Infinity, ease: "easeInOut" },
            rotateY: { duration: 10, repeat: Infinity, ease: "easeInOut" },
            rotateX: { duration: 9, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute w-[380px] overflow-hidden rounded-xl border border-zinc-200/50 bg-white/60 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/60"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-200/30 px-5 py-3 dark:border-white/5">
            <div className="flex items-center gap-2">
              <div className="flex size-5 items-center justify-center rounded bg-violet-500/15">
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none" className="text-violet-500">
                  <rect x="1" y="1" width="6" height="6" rx="1" fill="currentColor" opacity="0.6"/>
                  <rect x="9" y="1" width="6" height="6" rx="1" fill="currentColor"/>
                  <rect x="1" y="9" width="6" height="6" rx="1" fill="currentColor"/>
                  <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" opacity="0.6"/>
                </svg>
              </div>
              <span className="font-mono text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">Prompt Evaluation</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5">
              <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">Live</span>
            </div>
          </div>

          {/* Column Headers */}
          <div className="grid grid-cols-[1fr_1fr_52px] gap-px bg-zinc-100/80 px-5 py-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-500">
            <span>Prompt</span>
            <span>Expected</span>
            <span className="text-center">Result</span>
          </div>

          {/* Test Rows */}
          <div className="divide-y divide-zinc-100/60 dark:divide-white/5">
            {[
              { prompt: "Hey VinFast, bật điều hòa", expected: "intent: climate.on", pass: true, delay: 0.4 },
              { prompt: "Chỉ đường tới Landmark 81", expected: "intent: navi.search", pass: true, delay: 0.7 },
              { prompt: "Phát nhạc Sơn Tùng đi", expected: "intent: media.play", pass: true, delay: 1.0 },
              { prompt: "Tăng quạt gió lên nấc 3", expected: "intent: fan.set_lv", pass: false, delay: 1.3 },
              { prompt: "Hôm nay thời tiết sao", expected: "intent: info.weather", pass: true, delay: 1.6 },
            ].map((row, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: row.delay, duration: 0.4, ease: "easeOut" }}
                className="grid grid-cols-[1fr_1fr_52px] items-center gap-px px-5 py-2.5"
              >
                <span className="truncate font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
                  {row.prompt}
                </span>
                <span className="truncate font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
                  {row.expected}
                </span>
                <div className="flex justify-center">
                  <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold ${
                    row.pass 
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                      : 'bg-red-500/10 text-red-600 dark:text-red-400'
                  }`}>
                    {row.pass ? 'PASS' : 'FAIL'}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Footer Summary */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 0.5 }}
            className="flex items-center justify-between border-t border-zinc-200/30 px-5 py-2.5 dark:border-white/5"
          >
            <span className="font-mono text-[10px] text-zinc-400">5 prompts evaluated</span>
            <span className="font-mono text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">4/5 passed (80%)</span>
          </motion.div>
        </motion.div>

        {/* Right Widget: Accuracy Metrics Dashboard */}
        <motion.div
          initial={{ opacity: 0, x: 100, rotateY: -30, rotateX: 10, scale: 0.9 }}
          animate={{ 
            opacity: 1, 
            x: 280, 
            y: [20, 30, 20],
            rotateY: [-35, -30, -35], 
            rotateX: [15, 10, 15],
            scale: 1
          }}
          transition={{ 
            opacity: { duration: 1.5, ease: "easeOut", delay: 0.2 },
            x: { duration: 1.5, ease: "easeOut", delay: 0.2 },
            scale: { duration: 1.5, ease: "easeOut", delay: 0.2 },
            y: { duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
            rotateY: { duration: 10, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
            rotateX: { duration: 9, repeat: Infinity, ease: "easeInOut", delay: 0.5 }
          }}
          className="absolute w-[300px] rounded-xl border border-zinc-200/50 bg-white/60 p-5 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/60"
        >
          {/* Header */}
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-5 items-center justify-center rounded bg-blue-500/15">
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none" className="text-blue-500">
                  <path d="M2 12L6 4L10 8L14 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="font-mono text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">QC Metrics</span>
            </div>
            <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[9px] text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">24h</span>
          </div>
          
          {/* Metric Cards */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Accuracy", value: "96.8", suffix: "%", color: "text-emerald-600 dark:text-emerald-400", delay: 0.5 },
              { label: "Avg Latency", value: "142", suffix: "ms", color: "text-blue-600 dark:text-blue-400", delay: 0.7 },
              { label: "Test Runs", value: "1,247", suffix: "", color: "text-violet-600 dark:text-violet-400", delay: 0.9 },
              { label: "Fail Rate", value: "3.2", suffix: "%", color: "text-amber-600 dark:text-amber-400", delay: 1.1 },
            ].map((metric, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: metric.delay, duration: 0.4, ease: "easeOut" }}
                className="rounded-lg bg-zinc-50/80 p-3 dark:bg-zinc-800/40"
              >
                <div className="text-[9px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  {metric.label}
                </div>
                <div className={`mt-1 font-mono text-xl font-bold tabular-nums ${metric.color}`}>
                  {metric.value}
                  <span className="text-xs font-normal text-zinc-400 dark:text-zinc-500">{metric.suffix}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Mini Chart - Accuracy Trend */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.6 }}
            className="mt-4"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[9px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Accuracy Trend</span>
              <span className="flex items-center gap-1 text-[9px] text-emerald-600 dark:text-emerald-400">
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 6L4 2L7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                +2.1%
              </span>
            </div>
            <svg viewBox="0 0 240 40" className="w-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(16 185 129)" stopOpacity="0.2"/>
                  <stop offset="100%" stopColor="rgb(16 185 129)" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <motion.path
                d="M0 32 L30 28 L60 30 L90 22 L120 18 L150 20 L180 12 L210 10 L240 6"
                fill="none"
                stroke="rgb(16 185 129)"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 1.6, duration: 1.2, ease: "easeOut" }}
              />
              <path
                d="M0 32 L30 28 L60 30 L90 22 L120 18 L150 20 L180 12 L210 10 L240 6 L240 40 L0 40 Z"
                fill="url(#chartGradient)"
                opacity="0.5"
              />
            </svg>
          </motion.div>
        </motion.div>

      </div>
    </div>
  )
}
