import { useEffect, useState } from 'react'
import { motion } from 'motion/react'

interface BrandedLoadingProps {
  phrases: readonly string[]
  showSkeletons?: boolean
  className?: string
}

export function BrandedLoading({
  phrases,
  showSkeletons = true,
  className,
}: BrandedLoadingProps) {
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [text, setText] = useState('')

  useEffect(() => {
    let currentText = ''
    let charIndex = 0
    const targetPhrase = phrases[phraseIndex] ?? ''

    const typingInterval = window.setInterval(() => {
      if (charIndex < targetPhrase.length) {
        currentText += targetPhrase.charAt(charIndex)
        setText(currentText)
        charIndex += 1
      } else {
        window.clearInterval(typingInterval)
      }
    }, 35)

    const nextPhraseTimeout = window.setTimeout(() => {
      setPhraseIndex((index) => (index + 1) % phrases.length)
    }, 2500)

    return () => {
      window.clearInterval(typingInterval)
      window.clearTimeout(nextPhraseTimeout)
    }
  }, [phraseIndex, phrases])

  return (
    <div className={`mx-auto flex w-full max-w-sm flex-col items-center justify-center gap-2 p-6 select-none ${className ?? ''}`}>
      {/* Metallic Morphing Blob with VinFast Logo */}
      <div className="relative mb-6 flex size-20 items-center justify-center">
        {/* Glow ambient background */}
        <motion.div
          animate={{
            scale: [0.9, 1.1, 0.9],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute inset-1 rounded-full bg-primary/25 blur-xl"
        />

        {/* Morphing Liquid Metal Gradient Blob */}
        <motion.div
          animate={{
            borderRadius: [
              '42% 58% 70% 30% / 45% 45% 55% 55%',
              '70% 30% 52% 48% / 60% 40% 60% 40%',
              '28% 72% 38% 62% / 40% 60% 40% 60%',
              '42% 58% 70% 30% / 45% 45% 55% 55%',
            ],
            rotate: [0, 120, 240, 360],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute inset-0 bg-gradient-to-tr from-blue-600 via-primary to-emerald-500 opacity-85 shadow-[0_0_20px_rgba(59,130,246,0.25)]"
        />

        {/* Inner white/dark container for the logo */}
        <div className="absolute size-14 rounded-full bg-card/90 dark:bg-zinc-900/90 shadow-inner flex items-center justify-center z-10 border border-border/10">
          <img
            src="/logo.png"
            className="size-7 object-contain filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)] dark:brightness-110"
            alt="VinFast Logo"
          />
        </div>
      </div>

      {/* Typing Text */}
      <p className="flex h-6 items-center text-sm font-semibold tracking-tight text-foreground/90">
        {text}
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
          className="ml-0.5 inline-block h-4 w-[2px] bg-primary"
        />
      </p>

      {/* Skeletal hint */}
      {showSkeletons && (
        <div className="w-full mt-6 space-y-3 opacity-20">
          <motion.div
            animate={{ opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0 }}
            className="h-2 bg-foreground rounded-full w-full"
          />
          <motion.div
            animate={{ opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
            className="h-2 bg-foreground rounded-full w-[85%]"
          />
          <motion.div
            animate={{ opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
            className="h-2 bg-foreground rounded-full w-[60%]"
          />
        </div>
      )}
    </div>
  )
}
