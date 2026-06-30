import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { motion } from 'motion/react'
import { PlugIcon, RefreshCwIcon } from 'lucide-react'

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { FieldGroup, Field } from '@/components/ui/field'
import { InputGroup, InputGroupTextarea } from '@/components/ui/input-group'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

import parseCurl from 'parse-curl'

interface CurlImportCardProps {
  onImport: (curl: string, bodyTemplate?: string) => void
  isPending: boolean
  initialValue?: string | null
  hasExistingConfig?: boolean
}

export function CurlImportCard({ onImport, isPending, initialValue, hasExistingConfig }: CurlImportCardProps) {
  const [curlInput, setCurlInput] = useState(initialValue ?? '')
  const [jsonBody, setJsonBody] = useState('')
  const hasUserEdited = useRef(false)

  useEffect(() => {
    if (initialValue && !hasUserEdited.current) {
      setCurlInput(initialValue)
      tryParseCurlBody(initialValue)
    }
  }, [initialValue])

  function tryParseCurlBody(curlStr: string) {
    try {
      const parsed = parseCurl(curlStr)
      if (parsed.body) {
        try {
          // If it's valid JSON, format it nicely
          const parsedJson = JSON.parse(parsed.body)
          setJsonBody(JSON.stringify(parsedJson, null, 2))
        } catch {
          // Fallback to raw string if not JSON
          setJsonBody(parsed.body)
        }
      } else {
        setJsonBody('')
      }
    } catch {
      // Ignore parse errors while typing
    }
  }

  function handleCurlInputChange(event: ChangeEvent<HTMLTextAreaElement>): void {
    hasUserEdited.current = true
    const val = event.target.value
    setCurlInput(val)
    tryParseCurlBody(val)
  }

  const handleImport = () => {
    onImport(curlInput, jsonBody.trim() ? jsonBody : undefined)
    // Do NOT clear curlInput — keep it visible
  }

  return (
    <Card className="flex flex-col overflow-hidden transition-all duration-300 border-zinc-200/60 dark:border-zinc-800/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-none hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] rounded-2xl bg-white dark:bg-zinc-950">
      <CardHeader className="pb-5 pt-6 px-6">
        <CardTitle className="text-[17px] font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
          {hasExistingConfig ? 'Cập nhật cURL' : 'Dán cURL & Kết nối'}
        </CardTitle>
        <CardDescription className="text-[13px] text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed max-w-xl">
          {hasExistingConfig
            ? 'Dán lệnh cURL mới để cập nhật cấu hình và API key.'
            : 'Dán lệnh cURL để tự động bóc tách thông số, kiểm tra kết nối và lưu cấu hình.'}
        </CardDescription>
      </CardHeader>
      
      <div className="h-px w-full bg-zinc-100 dark:bg-zinc-800/80" />

      <CardContent className="flex-1 flex flex-col p-6">
        <FieldGroup className="flex-1 flex flex-col">
          <Field className="flex-1 flex flex-col gap-4">
            {/* cURL Input Box */}
             <div className="flex-1 flex flex-col rounded-xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 text-zinc-800 dark:text-zinc-100 shadow-sm transition-all focus-within:border-zinc-300 focus-within:dark:border-zinc-700 focus-within:shadow-md">
              <InputGroup className="flex-1 border-0 rounded-none shadow-none">
                <InputGroupTextarea
                  value={curlInput}
                  onChange={handleCurlInputChange}
                  placeholder="Ví dụ:&#10;curl -X POST https://api.atomesus.com/v1/chat/completions \&#10;  -H 'Content-Type: application/json' \&#10;  -H 'Authorization: SECRET_REDACTED' \&#10;  -d '{...}'"
                  className="flex-1 resize-none font-mono text-[13px] border-0 focus-visible:ring-0 bg-transparent p-5 min-h-[140px] text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 leading-relaxed selection:bg-blue-100 dark:selection:bg-blue-900/50 selection:text-blue-900 dark:selection:text-blue-100"
                  style={{ scrollbarWidth: 'thin' }}
                />
              </InputGroup>
            </div>

            {/* JSON Body Editor Box */}
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: jsonBody ? 'auto' : 0, opacity: jsonBody ? 1 : 0 }}
              className="overflow-hidden"
            >
              <div className="flex-1 flex flex-col rounded-xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 text-zinc-800 dark:text-zinc-100 shadow-sm relative transition-all focus-within:border-zinc-300 focus-within:dark:border-zinc-700 focus-within:shadow-md">
                <div className="relative flex items-center px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/50 select-none shrink-0">
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-mono text-amber-500/80 dark:text-amber-500/70 uppercase tracking-[0.15em] font-bold flex items-center gap-1.5">
                      JSON Body (Template)
                    </span>
                  </div>
                </div>
                <div className="absolute top-2.5 right-4 text-[10px] font-medium text-amber-700 dark:text-amber-400 bg-amber-100/50 dark:bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-200/50 dark:border-amber-500/20 flex items-center gap-1.5 shadow-sm">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                  </span>
                  Ghi đè body của cURL
                </div>
                
                <div className="px-5 pt-4 text-[12.5px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 leading-relaxed">
                  Thay thế giá trị tĩnh thành tên cột trong Dataset (VD: <code className="font-mono text-[11.5px] text-amber-700 dark:text-amber-400 font-bold bg-amber-100/50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-200/50 dark:border-amber-500/20">{"{{Input}}"}</code>)
                </div>

                <InputGroup className="flex-1 border-0 rounded-none shadow-none mt-2">
                  <InputGroupTextarea
                    value={jsonBody}
                    onChange={(e) => setJsonBody(e.target.value)}
                    placeholder='{ "message": "{{Input}}" }'
                    className="flex-1 resize-y font-mono text-[13px] border-0 focus-visible:ring-0 bg-transparent px-5 pb-5 min-h-[160px] text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 leading-relaxed selection:bg-amber-100 dark:selection:bg-amber-900/30 selection:text-amber-900 dark:selection:text-amber-100"
                    style={{ scrollbarWidth: 'thin' }}
                  />
                </InputGroup>
              </div>
            </motion.div>
            
            <div className="mt-2 flex justify-end">
              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} className="inline-block">
                <Button
                  type="button"
                  onClick={handleImport}
                  disabled={!curlInput.trim() || isPending}
                  className="bg-blue-500 hover:bg-blue-600 text-white shadow-[0_4px_14px_0_rgba(59,130,246,0.39)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.23)] border-0 h-10 px-6 rounded-lg font-semibold text-[13px] transition-all disabled:opacity-50 disabled:shadow-none"
                >
                  {isPending ? (
                    <Spinner data-icon="inline-start" className="text-white/70" />
                  ) : hasExistingConfig ? (
                    <RefreshCwIcon data-icon="inline-start" className="size-4" />
                  ) : (
                    <PlugIcon data-icon="inline-start" className="size-4" />
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
