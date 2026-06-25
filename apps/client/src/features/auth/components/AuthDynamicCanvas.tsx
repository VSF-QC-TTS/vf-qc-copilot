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
        
        {/* Left Widget: Mock CLI Terminal */}
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
          className="absolute w-[360px] overflow-hidden rounded-xl border border-white/10 bg-[#0c0c0e] shadow-2xl"
        >
          {/* Mac-style Window Header */}
          <div className="flex h-9 items-center gap-2 border-b border-white/5 bg-white/[0.02] px-4">
            <div className="size-2.5 rounded-full bg-zinc-700" />
            <div className="size-2.5 rounded-full bg-zinc-700" />
            <div className="size-2.5 rounded-full bg-zinc-700" />
          </div>
          {/* Terminal Body */}
          <div className="p-5 font-mono text-[12px] leading-relaxed text-zinc-400">
             <div className="text-emerald-400">➜  ~ npx playwright test</div>
             <div className="mt-2 text-zinc-500">Running 142 tests using 4 workers...</div>
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-3 flex items-center gap-2">
               <span className="text-emerald-500">✓</span> [chromium] › auth.spec.ts (1.2s)
             </motion.div>
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="flex items-center gap-2">
               <span className="text-emerald-500">✓</span> [firefox] › projects.spec.ts (0.8s)
             </motion.div>
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="flex items-center gap-2">
               <span className="text-emerald-500">✓</span> [webkit] › targets.spec.ts (2.1s)
             </motion.div>
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="mt-4 font-semibold text-emerald-400">
               142 passed (18.4s)
             </motion.div>
          </div>
        </motion.div>

        {/* Right Widget: CI/CD Pipeline Mockup */}
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
          className="absolute w-[320px] rounded-xl border border-zinc-200/50 bg-white/60 p-6 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/60"
        >
          <div className="mb-6 flex items-center justify-between">
            <div className="h-3 w-24 rounded-full bg-zinc-200 dark:bg-zinc-700" />
            <div className="flex h-5 w-12 items-center justify-center rounded bg-emerald-500/20 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">PASS</div>
          </div>
          
          {/* Pipeline Blocks */}
          <div className="space-y-3">
            {[
              { label: "Build", width: "100%", color: "bg-blue-500" },
              { label: "Unit Tests", width: "100%", color: "bg-emerald-500" },
              { label: "E2E Testing", width: "85%", color: "bg-purple-500" },
              { label: "Deployment", width: "40%", color: "bg-amber-500" },
            ].map((step, i) => (
              <div key={i} className="relative">
                <div className="mb-1 flex justify-between font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
                  <span>{step.label}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: step.width }}
                    transition={{ duration: 1, delay: 0.5 + i * 0.2, ease: "easeOut" }}
                    className={`h-full rounded-full ${step.color}`} 
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  )
}
