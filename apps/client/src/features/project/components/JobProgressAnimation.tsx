import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Sparkles } from 'lucide-react'

interface JobProgressAnimationProps {
  phrases: readonly string[]
  iconLabel?: string
}

export function JobProgressAnimation({ phrases, iconLabel = 'Progress' }: JobProgressAnimationProps) {
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
    <div className="mx-auto flex w-full max-w-sm flex-col items-center justify-center gap-2 p-6">
      <div className="relative mb-4 flex size-14 items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full border-[1.5px] border-primary/10 border-t-primary"
        />
        <motion.div
          animate={{ scale: [0.85, 1.15, 0.85], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-2 rounded-full bg-primary/20 blur-md"
        />
        <Sparkles className="relative z-10 size-5 text-primary" aria-label={iconLabel} />
      </div>

      <p className="flex h-6 items-center text-sm font-medium tracking-tight text-foreground">
        {text}
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
          className="ml-0.5 inline-block h-4 w-[2px] bg-primary"
        />
      </p>

      <div className="mt-6 w-full space-y-3 opacity-20">
        <motion.div
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0 }}
          className="h-2 w-full rounded-full bg-foreground"
        />
        <motion.div
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
          className="h-2 w-[85%] rounded-full bg-foreground"
        />
        <motion.div
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
          className="h-2 w-[60%] rounded-full bg-foreground"
        />
      </div>
    </div>
  )
}
