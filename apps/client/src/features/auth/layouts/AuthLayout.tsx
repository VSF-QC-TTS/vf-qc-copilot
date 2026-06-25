import { Outlet } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import { AuthDynamicCanvas } from '../components/AuthDynamicCanvas'

export function AuthLayout() {
  const reduceMotion = useReducedMotion()

  return (
    <>
      <AuthDynamicCanvas />

      {/* Form overlay */}
      <div className="relative z-10 flex min-h-[100dvh] items-center justify-center px-4 py-8 pointer-events-none">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[420px] pointer-events-auto"
        >

          <div className="rounded-2xl border border-white/20 dark:border-white/10 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl p-6 shadow-2xl sm:p-8">
            <Outlet />
          </div>
        </motion.div>
      </div>
    </>
  )
}
