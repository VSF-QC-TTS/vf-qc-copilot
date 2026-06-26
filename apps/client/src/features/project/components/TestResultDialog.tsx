import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { CheckCircle2, XCircle, Clock, CopyIcon, CheckIcon } from 'lucide-react'

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
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-3">
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          className="size-2.5 rounded-full bg-primary"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay: 0.15 }}
          className="size-2.5 rounded-full bg-primary"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
          className="size-2.5 rounded-full bg-primary"
        />
      </div>
      <p className="text-sm text-muted-foreground flex items-center">
        {text}
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
          className="inline-block w-0.5 h-3.5 ml-0.5 bg-muted-foreground"
        />
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Result view
// ---------------------------------------------------------------------------

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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-4"
    >
      {/* Status bar */}
      <div className="flex items-center gap-3">
        <div className={`flex items-center justify-center size-8 rounded-full shrink-0 ${isSuccess ? 'bg-emerald-100 dark:bg-emerald-950/50' : 'bg-red-100 dark:bg-red-950/50'}`}>
          {isSuccess ? (
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <XCircle className="size-4 text-red-600 dark:text-red-400" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={isSuccess ? 'default' : 'destructive'}
            className={isSuccess ? 'bg-emerald-500 text-white' : ''}
          >
            HTTP {result.httpStatus}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3" />
            {result.latencyMs}ms
          </div>
        </div>
      </div>

      {/* Error message */}
      {result.errorMessage && (
        <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3 border border-destructive/20">
          {result.errorMessage}
        </div>
      )}

      {/* Response body */}
      {formattedBody && (
        <div className="relative group">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity size-7 p-0"
          >
            {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
          </Button>
          <pre className="text-xs font-mono leading-relaxed whitespace-pre-wrap break-all bg-muted/40 rounded-lg p-4 max-h-[350px] overflow-auto border">
            {formattedBody}
          </pre>
        </div>
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
