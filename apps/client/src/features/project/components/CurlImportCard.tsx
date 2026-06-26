import { useState, useEffect } from 'react'
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
  const [curlInput, setCurlInput] = useState(initialValue || '')

  useEffect(() => {
    if (initialValue && !curlInput) {
      setCurlInput(initialValue)
    }
  }, [initialValue])

  const handleImport = () => {
    onImport(curlInput)
    // Do NOT clear curlInput — keep it visible
  }

  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader className="pb-4 border-b">
        <CardTitle className="text-base font-semibold">
          {hasExistingConfig ? 'Cập nhật cURL' : 'Dán cURL & Kết nối'}
        </CardTitle>
        <CardDescription className="text-sm">
          {hasExistingConfig
            ? 'Dán lệnh cURL mới để cập nhật cấu hình và API key.'
            : 'Dán lệnh cURL để tự động bóc tách thông số, kiểm tra kết nối và lưu cấu hình.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-5">
        <FieldGroup className="flex-1 flex flex-col">
          <Field className="flex-1 flex flex-col">
            <InputGroup className="flex-1 rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-ring transition-all bg-muted/20">
              <InputGroupTextarea
                value={curlInput}
                onChange={(e) => setCurlInput(e.target.value)}
                placeholder="Ví dụ: curl -X POST https://api.example.com/v1/chat -H 'Authorization: Bearer token...' -d '{...}'"
                className="flex-1 resize-none font-mono text-[13px] border-0 focus-visible:ring-0 bg-transparent p-4 min-h-[160px]"
              />
            </InputGroup>
            <div className="mt-4 flex justify-end">
              <Button
                type="button"
                onClick={handleImport}
                disabled={!curlInput.trim() || isPending}
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
            </div>
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  )
}
