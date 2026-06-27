import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { CheckCircle2, XCircle, Clock, CopyIcon, CheckIcon, Sparkles } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import type { TestExecutionResult } from '@/types/config'

// ---------------------------------------------------------------------------
// Loading typing effect
// ---------------------------------------------------------------------------

const LOADING_PHRASES = [
  'Khởi tạo kết nối API...',
  'Đang phân tích cấu trúc...',
  'Bóc tách luồng dữ liệu...',
  'Đánh giá kết quả phản hồi...',
  'Sắp hoàn tất...',
]

function LoadingTypingEffect() {
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [text, setText] = useState('')

  useEffect(() => {
    let currentText = ''
    let charIndex = 0
    const targetPhrase = LOADING_PHRASES[phraseIndex]

    const typingInterval = setInterval(() => {
      if (charIndex < targetPhrase.length) {
        currentText += targetPhrase.charAt(charIndex)
        setText(currentText)
        charIndex++
      } else {
        clearInterval(typingInterval)
      }
    }, 35)

    const nextPhraseTimeout = setTimeout(() => {
      setPhraseIndex((i) => (i + 1) % LOADING_PHRASES.length)
    }, 2500)

    return () => {
      clearInterval(typingInterval)
      clearTimeout(nextPhraseTimeout)
    }
  }, [phraseIndex])

  return (
    <div className="flex flex-col items-center justify-center gap-2 w-full max-w-sm mx-auto p-6">
      {/* Premium Orb */}
      <div className="relative flex items-center justify-center size-14 mb-4">
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
        <Sparkles className="size-5 text-primary relative z-10" />
      </div>

      {/* Typing Text */}
      <p className="text-sm font-medium text-foreground tracking-tight flex items-center h-6">
        {text}
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
          className="inline-block w-[2px] h-4 ml-0.5 bg-primary"
        />
      </p>

      {/* Skeletal hint */}
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
    </div>
  )
}

// ---------------------------------------------------------------------------
// Result view
// ---------------------------------------------------------------------------

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
}
const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 20 } }
}

function ResultView({ result }: { result: TestExecutionResult }) {
  const [copied, setCopied] = useState(false)
  const isSuccess = result.httpStatus >= 200 && result.httpStatus < 300

  let responseBodyParsed: any = null
  if (result.responseBody) {
    try {
      responseBodyParsed = JSON.parse(result.responseBody)
    } catch {
      // keep null
    }
  }

  const formattedBody = responseBodyParsed
    ? JSON.stringify(responseBodyParsed, null, 2)
    : result.responseBody || ''

  const handleCopy = async () => {
    await navigator.clipboard.writeText(formattedBody)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-6"
    >
      {/* Status bar */}
      <motion.div variants={staggerItem} className="flex items-center gap-4 bg-background border border-border/60 rounded-xl p-3 shadow-sm">
        <div className={`flex items-center justify-center size-10 rounded-full shrink-0 ${isSuccess ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
          {isSuccess ? (
            <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <XCircle className="size-5 text-red-600 dark:text-red-400" />
          )}
        </div>
        <div className="flex flex-col gap-1 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-tight text-sm text-foreground">
              {isSuccess ? 'Kết nối thành công' : 'Kết nối thất bại'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
            <Badge
              variant={isSuccess ? 'default' : 'destructive'}
              className={isSuccess ? 'bg-emerald-500 text-white' : ''}
            >
              HTTP {result.httpStatus}
            </Badge>
            <span className="flex items-center gap-1"><Clock className="size-3" /> {result.latencyMs}ms</span>
          </div>
        </div>
      </motion.div>

      {/* Error message */}
      {result.errorMessage && (
        <motion.div variants={staggerItem} className="text-sm text-destructive bg-destructive/10 rounded-xl p-4 border border-destructive/20">
          <strong className="block mb-1 font-semibold">Chi tiết lỗi:</strong>
          {result.errorMessage}
        </motion.div>
      )}

      {/* Response body */}
      {formattedBody && (
        <motion.div variants={staggerItem} className="relative group mt-2">
          <div className="absolute -top-3 left-4 px-2 bg-zinc-950 text-[10px] uppercase tracking-widest text-zinc-400 font-semibold z-10">
            Raw Response
          </div>
          <pre className="text-[13px] font-mono leading-relaxed whitespace-pre-wrap break-all bg-zinc-950 text-zinc-50 rounded-xl p-5 pt-6 max-h-[350px] overflow-auto shadow-inner border border-zinc-800 relative">
            {formattedBody}
          </pre>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity h-8 bg-zinc-800 text-zinc-100 border-zinc-700 hover:bg-zinc-700 hover:text-white"
          >
            {copied ? <CheckIcon className="size-3.5 mr-1.5" /> : <CopyIcon className="size-3.5 mr-1.5" />}
            {copied ? 'Đã chép' : 'Copy'}
          </Button>
        </motion.div>
      )}
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Main dialog
// ---------------------------------------------------------------------------

interface TestResultDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isPending: boolean
  result: TestExecutionResult | null
}

export function TestResultDialog({ open, onOpenChange, isPending, result }: TestResultDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg gap-0 p-0 overflow-hidden">
        <div className="px-6 pt-5 pb-4 border-b">
          <DialogTitle className="text-base font-semibold">
            {isPending ? 'Đang kiểm tra kết nối...' : 'Kết quả kiểm tra'}
          </DialogTitle>
        </div>

        <div className="px-6 py-5 min-h-[200px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {isPending ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center py-8"
              >
                <LoadingTypingEffect />
              </motion.div>
            ) : result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <ResultView result={result} />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Footer — only show when result is ready */}
        {!isPending && result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-6 py-3 border-t bg-muted/30 flex justify-end"
          >
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Đóng
            </Button>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  )
}
