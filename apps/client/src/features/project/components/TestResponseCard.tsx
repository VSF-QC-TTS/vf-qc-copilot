import { CheckCircle2, XCircle, Activity, Clock, Server } from 'lucide-react'
import { motion } from 'motion/react'
import { useState, useEffect } from 'react'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const LOADING_PHRASES = [
  'Khởi tạo kết nối API...',
  'Đang phân tích cấu trúc...',
  'Bóc tách luồng dữ liệu...',
  'Đánh giá kết quả phản hồi...',
  'Sắp hoàn tất...'
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
    }, 40)

    const nextPhraseTimeout = setTimeout(() => {
      setPhraseIndex((i) => (i + 1) % LOADING_PHRASES.length)
    }, 2500)

    return () => {
      clearInterval(typingInterval)
      clearTimeout(nextPhraseTimeout)
    }
  }, [phraseIndex])

  return (
    <div className="flex flex-col items-center justify-center">
      <h3 className="text-lg font-medium text-primary mb-2 flex items-center">
        Hệ thống đang thực thi
        <motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          ...
        </motion.span>
      </h3>
      <div className="h-5">
        <p className="text-sm text-muted-foreground flex items-center">
          {text}
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
            className="inline-block w-1 h-3.5 ml-0.5 bg-muted-foreground"
          />
        </p>
      </div>
    </div>
  )
}

interface TestResponseCardProps {
  result: string
  isPending?: boolean
}

export function TestResponseCard({ result, isPending }: TestResponseCardProps) {
  let parsed: any = null
  let isSuccess = false
  let responseBodyObj = null

  if (result) {
    try {
      parsed = JSON.parse(result)
      isSuccess = parsed && !parsed.error && !parsed.errorMessage && (parsed.successful === true || (parsed.httpStatus !== undefined && parsed.httpStatus < 400))
      try {
         if (parsed.responseBody) {
             responseBodyObj = JSON.parse(parsed.responseBody)
         }
      } catch {
         // keep it null
      }
    } catch {
      // not valid json
    }
  }

  return (
    <Card className="h-full max-h-[550px] flex flex-col overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Activity className="size-4 text-primary" />
          Kết quả Trả về
        </CardTitle>
        {result && parsed && !isPending && (
          <Badge variant={isSuccess ? 'default' : 'destructive'} className={`flex items-center gap-1.5 ${isSuccess ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : ''}`}>
            {isSuccess ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />}
            {isSuccess ? 'Thành công' : 'Thất bại'}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="flex-1 p-0 flex flex-col min-h-0">
        {isPending ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[250px]">
             <div className="flex items-center justify-center gap-4 mb-8 h-16">
                <motion.div
                  animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5], y: [0, -12, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="w-4 h-4 rounded-full bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.8)]"
                />
                <motion.div
                  animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5], y: [0, -12, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                  className="w-4 h-4 rounded-full bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.8)]"
                />
                <motion.div
                  animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5], y: [0, -12, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                  className="w-4 h-4 rounded-full bg-primary shadow-[0_0_20px_var(--primary)]"
                />
             </div>
             <LoadingTypingEffect />
          </div>
        ) : result ? (
          <div className="flex flex-col h-full">
            {parsed && parsed.httpStatus && (
              <div className="flex gap-3 p-3 bg-muted/30 border-b">
                <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border ${isSuccess ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50' : 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400 border-red-200 dark:border-red-800/50'}`}>
                   <div className={`w-1.5 h-1.5 rounded-full ${isSuccess ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                   {parsed.httpStatus} {isSuccess ? 'OK' : 'ERROR'}
                </div>
                {parsed.latencyMs != null && (
                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 text-xs font-medium border border-blue-200 dark:border-blue-800/50">
                    <Clock className="size-3" />
                    {parsed.latencyMs}ms
                  </div>
                )}
              </div>
            )}
            <div className="p-4 flex-1 overflow-auto bg-muted/10">
               {parsed?.errorMessage ? (
                 <div className="text-destructive text-sm font-medium">{parsed.errorMessage}</div>
               ) : (
                 <pre className="text-xs font-mono text-foreground/80 leading-relaxed whitespace-pre-wrap break-all">
                   {responseBodyObj ? JSON.stringify(responseBodyObj, null, 2) : parsed?.responseBody || JSON.stringify(parsed, null, 2) || result}
                 </pre>
               )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[250px] opacity-60">
             <Server className="size-12 text-muted-foreground mb-4 opacity-50 stroke-[1.5]" />
             <span className="text-muted-foreground">Chưa có dữ liệu. Hãy chạy cURL hoặc Test thử.</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
