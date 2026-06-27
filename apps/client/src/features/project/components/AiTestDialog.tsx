import { useState, useEffect } from 'react'
import { motion, AnimatePresence, type Variants } from 'motion/react'
import { CheckCircle2, XCircle, Clock, CopyIcon, CheckIcon, PlayIcon, CoinsIcon, MessageSquareTextIcon, Sparkles } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'

import type { AiExecutionResult } from '@/types/config'

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
// Result view for AI
// ---------------------------------------------------------------------------

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
}
const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 100, damping: 20 } }
}

function AiResultView({ result }: { result: AiExecutionResult }) {
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
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-6 pt-2"
    >
      {/* Status bar */}
      <motion.div variants={staggerItem} className="flex items-center gap-4 bg-background border border-border/60 rounded-xl p-3 shadow-sm">
        <div className={`flex items-center justify-center size-10 rounded-full shrink-0 ${result.successful ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
          {result.successful ? (
            <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <XCircle className="size-5 text-red-600 dark:text-red-400" />
          )}
        </div>
        <div className="flex flex-col gap-1 flex-1">
          <span className="font-semibold tracking-tight text-sm text-foreground">
            {result.successful ? 'Sinh Text Thành Công' : 'Đã xảy ra lỗi'}
          </span>
          <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
            <span className="flex items-center gap-1"><Clock className="size-3" /> {result.latencyMs}ms</span>
            {result.promptTokens > 0 && (
              <>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="flex items-center gap-1"><CoinsIcon className="size-3" /> {result.promptTokens} + {result.completionTokens} tokens</span>
              </>
            )}
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

      {/* Generated text */}
      {result.generatedText && (
        <motion.div variants={staggerItem} className="relative group mt-2">
          <div className="absolute -top-3 left-4 px-2 bg-[#f4f4f5] dark:bg-[#18181b] text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
            AI Output
          </div>
          <div className="text-[13px] leading-relaxed bg-background/60 rounded-xl p-5 pt-6 max-h-[350px] overflow-auto border shadow-sm whitespace-pre-wrap text-foreground/90">
            {result.generatedText}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity h-8 bg-background/80 backdrop-blur-sm shadow-sm"
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
// Main dialog — includes prompt input + result
// ---------------------------------------------------------------------------

interface AiTestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isPending: boolean
  result: AiExecutionResult | null
  onTest: (systemPrompt: string, userMessage: string) => void
}

export function AiTestDialog({ open, onOpenChange, isPending, result, onTest }: AiTestDialogProps) {
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful assistant.')
  const [userMessage, setUserMessage] = useState('Hello, world!')

  const handleSubmit = () => {
    onTest(systemPrompt, userMessage)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] w-[90vw] gap-0 p-0 overflow-hidden">
        <div className="px-6 pt-5 pb-4 border-b shrink-0">
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <MessageSquareTextIcon className="size-4" />
            Playground — Thử nghiệm AI
          </DialogTitle>
        </div>

        <div className="flex flex-col md:flex-row h-[70vh] max-h-[600px] bg-[#f4f4f5] dark:bg-[#18181b]">
          {/* Left panel: Prompt inputs */}
          <div className="flex-1 flex flex-col gap-5 p-6 border-r overflow-y-auto bg-background">
            <FieldGroup className="flex-1">
              <Field className="flex flex-col flex-1 h-full">
                <FieldLabel className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.1em]">System Prompt</FieldLabel>
                <Textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="resize-none min-h-[120px] flex-1 text-[13px] font-mono leading-relaxed bg-background shadow-sm focus-visible:ring-1"
                  disabled={isPending}
                />
              </Field>
              <Field className="flex flex-col flex-1 h-full mt-4">
                <FieldLabel className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.1em]">User Message</FieldLabel>
                <Textarea
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value)}
                  className="resize-none min-h-[120px] flex-1 text-[13px] font-mono leading-relaxed bg-background shadow-sm focus-visible:ring-1"
                  disabled={isPending}
                />
              </Field>
            </FieldGroup>

            <div className="flex justify-end shrink-0 pt-4">
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isPending || !userMessage.trim()}
                className="w-full sm:w-auto shadow-sm"
              >
                {isPending ? <Spinner data-icon="inline-start" /> : <PlayIcon data-icon="inline-start" />}
                {isPending ? 'Đang gọi AI...' : 'Chạy thử'}
              </Button>
            </div>
          </div>

          {/* Right panel: Result area */}
          <div className="flex-1 p-6 overflow-y-auto flex flex-col relative">
            <AnimatePresence mode="wait">
              {isPending && !result ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex items-center justify-center"
                >
                  <LoadingTypingEffect />
                </motion.div>
              ) : result ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 flex flex-col"
                >
                  <AiResultView result={result} />
                </motion.div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm flex-col gap-4">
                  <div className="size-16 rounded-full bg-border/40 flex items-center justify-center">
                    <MessageSquareTextIcon className="size-8 opacity-40" />
                  </div>
                  <p className="font-medium opacity-80">Nhấn "Chạy thử" để xem kết quả</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
