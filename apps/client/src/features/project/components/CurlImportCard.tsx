import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { motion } from 'motion/react'
import { PlugIcon, RefreshCwIcon } from 'lucide-react'

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { FieldGroup, Field } from '@/components/ui/field'
import { InputGroup, InputGroupTextarea } from '@/components/ui/input-group'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

interface CurlImportCardProps {
  onImport: (curl: string) => void
  isPending: boolean
  initialValue?: string | null
  hasExistingConfig?: boolean
}

export function CurlImportCard({ onImport, isPending, initialValue, hasExistingConfig }: CurlImportCardProps) {
  const [curlInput, setCurlInput] = useState(initialValue ?? '')
  const hasUserEdited = useRef(false)

  useEffect(() => {
    if (initialValue && !hasUserEdited.current) {
      setCurlInput(initialValue)
    }
  }, [initialValue])

  function handleCurlInputChange(event: ChangeEvent<HTMLTextAreaElement>): void {
    hasUserEdited.current = true
    setCurlInput(event.target.value)
  }

  const handleImport = () => {
    onImport(curlInput)
    // Do NOT clear curlInput — keep it visible
  }

  return (
    <Card className="flex flex-col overflow-hidden shadow-sm transition-all duration-300 border-border/60 hover:shadow-md hover:border-primary/10">
      <CardHeader className="pb-4 border-b border-border/40 bg-muted/20">
        <CardTitle className="text-base font-bold text-foreground">
          {hasExistingConfig ? 'Cập nhật cURL' : 'Dán cURL & Kết nối'}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground mt-1">
          {hasExistingConfig
            ? 'Dán lệnh cURL mới để cập nhật cấu hình và API key.'
            : 'Dán lệnh cURL để tự động bóc tách thông số, kiểm tra kết nối và lưu cấu hình.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-5">
        <FieldGroup className="flex-1 flex flex-col">
          <Field className="flex-1 flex flex-col">
            {/* Developer Terminal Box */}
             <div className="flex-1 flex flex-col rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 text-zinc-100 shadow-md">
              {/* Header macOS-style terminal top bar */}
              <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-950 select-none shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-[#ff5f56]/90 shadow-sm" />
                  <span className="size-2.5 rounded-full bg-[#ffbd2e]/90 shadow-sm" />
                  <span className="size-2.5 rounded-full bg-[#27c93f]/90 shadow-sm" />
                </div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-semibold">cURL Terminal</span>
                <div className="w-10" />
              </div>
              
              <InputGroup className="flex-1 border-0">
                <InputGroupTextarea
                  value={curlInput}
                  onChange={handleCurlInputChange}
                  placeholder="Ví dụ:&#10;curl -X POST https://api.atomesus.com/v1/chat/completions \&#10;  -H 'Content-Type: application/json' \&#10;  -H 'Authorization: SECRET_REDACTED' \&#10;  -d '{...}'"
                  className="flex-1 resize-none font-mono text-[13px] border-0 focus-visible:ring-0 bg-transparent p-4 min-h-[180px] text-zinc-200 placeholder:text-zinc-700 leading-relaxed selection:bg-zinc-800 selection:text-zinc-100"
                  style={{ scrollbarColor: '#3f3f46 transparent', scrollbarWidth: 'thin' }}
                />
              </InputGroup>
            </div>
            
            <div className="mt-4 flex justify-end">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="button"
                  onClick={handleImport}
                  disabled={!curlInput.trim() || isPending}
                  className="shadow-sm transition-all cursor-pointer font-semibold text-xs"
                >
                  {isPending ? (
                    <Spinner data-icon="inline-start" />
                  ) : hasExistingConfig ? (
                    <RefreshCwIcon data-icon="inline-start" />
                  ) : (
                    <PlugIcon data-icon="inline-start" />
                  )}
                  {isPending
                    ? 'Đang kết nối...'
                    : hasExistingConfig
                      ? 'Cập nhật & Kết nối'
                      : 'Kết nối & Lưu'}
                </Button>
              </motion.div>
            </div>
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  )
}
