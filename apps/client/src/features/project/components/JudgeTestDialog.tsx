import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { CheckCircle2, XCircle, Clock, CopyIcon, CheckIcon, PlayIcon, CoinsIcon, MessageSquareTextIcon } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'

import type { JudgeExecutionResult } from '@/types/config'

// ---------------------------------------------------------------------------
// Loading typing effect
// ---------------------------------------------------------------------------

const LOADING_PHRASES = [
  'Gửi prompt đến AI...',
  'AI đang suy luận...',
  'Phân tích ngữ cảnh...',
  'Tổng hợp câu trả lời...',
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
// Result view for Judge
// ---------------------------------------------------------------------------

function JudgeResultView({ result }: { result: JudgeExecutionResult }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (result.generatedText) {
      await navigator.clipboard.writeText(result.generatedText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
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
        <div className={`flex items-center justify-center size-8 rounded-full shrink-0 ${result.successful ? 'bg-emerald-100 dark:bg-emerald-950/50' : 'bg-red-100 dark:bg-red-950/50'}`}>
          {result.successful ? (
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <XCircle className="size-4 text-red-600 dark:text-red-400" />
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant={result.successful ? 'default' : 'destructive'}
            className={result.successful ? 'bg-emerald-500 text-white' : ''}
          >
            {result.successful ? 'Thành công' : 'Thất bại'}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3" />
            {result.latencyMs}ms
          </div>
          {result.promptTokens > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <CoinsIcon className="size-3" />
              {result.promptTokens} + {result.completionTokens} tokens
            </div>
          )}
        </div>
      </div>

      {/* Error message */}
      {result.errorMessage && (
        <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3 border border-destructive/20">
          {result.errorMessage}
        </div>
      )}

      {/* Generated text */}
      {result.generatedText && (
        <div className="relative group">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity size-7 p-0"
          >
            {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
          </Button>
          <div className="text-sm leading-relaxed bg-muted/40 rounded-lg p-4 max-h-[350px] overflow-auto border whitespace-pre-wrap">
            {result.generatedText}
          </div>
        </div>
      )}
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Main dialog — includes prompt input + result
// ---------------------------------------------------------------------------

interface JudgeTestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isPending: boolean
  result: JudgeExecutionResult | null
  onTest: (systemPrompt: string, userMessage: string) => void
}

export function JudgeTestDialog({ open, onOpenChange, isPending, result, onTest }: JudgeTestDialogProps) {
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful assistant.')
  const [userMessage, setUserMessage] = useState('Hello, world!')

  const handleSubmit = () => {
    onTest(systemPrompt, userMessage)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg gap-0 p-0 overflow-hidden">
        <div className="px-6 pt-5 pb-4 border-b">
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <MessageSquareTextIcon className="size-4" />
            Playground — Thử nghiệm AI
          </DialogTitle>
        </div>

        <div className="px-6 py-5 flex flex-col gap-5">
          {/* Prompt inputs */}
          <FieldGroup>
            <Field>
              <FieldLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">System Prompt</FieldLabel>
              <Textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="resize-none min-h-[80px] text-sm"
                disabled={isPending}
              />
            </Field>
            <Field>
              <FieldLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">User Message</FieldLabel>
              <Textarea
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                className="resize-none min-h-[80px] text-sm"
                disabled={isPending}
              />
            </Field>
          </FieldGroup>

          <div className="flex justify-end">
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isPending || !userMessage.trim()}
            >
              {isPending ? <Spinner data-icon="inline-start" /> : <PlayIcon data-icon="inline-start" />}
              {isPending ? 'Đang gọi AI...' : 'Chạy thử'}
            </Button>
          </div>

          {/* Result area */}
          <AnimatePresence mode="wait">
            {isPending && !result ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center py-6"
              >
                <LoadingTypingEffect />
              </motion.div>
            ) : result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <JudgeResultView result={result} />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  )
}
