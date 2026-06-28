import { useState, type ReactElement } from 'react'
import { Eye, Search } from 'lucide-react'

import type { ResponseFieldExampleResponse, SchemaColumnResponse, VerificationItemRequest } from '@/types/config'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const PROMPT_TEMPLATES = {
  accuracy: `Bạn là QC/Tester. Hãy đánh giá độ chính xác của câu trả lời từ Bot ($response.answer) đối chiếu với dữ liệu kỳ vọng ($dataset.ground_truth).

Tiêu chí đánh giá:
- Câu trả lời của Bot phải có đầy đủ các thông tin cốt lõi được nêu trong dữ liệu kỳ vọng.
- Không được sai lệch các dữ liệu quan trọng như số điện thoại, ngày tháng, thông số kỹ thuật.

Đầu ra yêu cầu:
- Trả về điểm 1 (Đúng/Đạt) hoặc 0 (Sai/Không đạt).
- Kèm theo lý do ngắn gọn.`,

  fluency: `Bạn là QC/Tester. Hãy đánh giá độ trôi chảy, tự nhiên và đúng giọng điệu thương hiệu của câu trả lời từ Bot ($response.answer).

Tiêu chí đánh giá:
- Bot sử dụng ngôn từ lịch sự, thân thiện, xưng hô phù hợp.
- Câu trả lời mạch lạc, không lủng củng hay lặp từ vô nghĩa.

Đầu ra yêu cầu:
- Trả về điểm 1 (Đạt yêu cầu giọng điệu) hoặc 0 (Không đạt).
- Kèm theo lý do ngắn gọn.`,

  hallucination: `Bạn là QC/Tester. Hãy kiểm tra xem câu trả lời của Bot ($response.answer) có bịa đặt ra thông tin nằm ngoài phạm vi tài liệu nghiệp vụ ($dataset.ground_truth) hay không (lỗi Hallucination).

Tiêu chí đánh giá:
- Chỉ đánh giá dựa trên thông tin được cung cấp trong tài liệu.
- Nếu Bot tự ý sáng tạo thông tin chưa được kiểm chứng, đánh giá là Không Đạt (0).

Đầu ra yêu cầu:
- Trả về điểm 1 (Đạt - Không bịa đặt) hoặc 0 (Có bịa đặt thông tin).
- Kèm theo lý do ngắn gọn.`,

  conciseness: `Bạn là QC/Tester. Hãy đánh giá mức độ ngắn gọn, súc tích và trực diện của câu trả lời từ Bot ($response.answer) so với câu trả lời kỳ vọng ($dataset.ground_truth).

Tiêu chí đánh giá:
- Trả lời đúng trọng tâm câu hỏi của người dùng, không dông dài hoặc đi lan man sang chủ đề khác.
- Lược bỏ các từ ngữ thừa thãi không cần thiết.

Đầu ra yêu cầu:
- Trả về điểm 1 (Đạt - Súc tích) hoặc 0 (Không đạt - Dông dài).
- Kèm theo lý do ngắn gọn.`
}

interface LlmJudgeEditorProps {
  item: VerificationItemRequest
  responseFields: Array<string | ResponseFieldExampleResponse>
  columns: SchemaColumnResponse[]
  onChange: (item: VerificationItemRequest) => void
}

export function LlmJudgeEditor({
  item,
  responseFields,
  columns,
  onChange,
}: LlmJudgeEditorProps): ReactElement {
  const targetPaths = item.targetPaths ?? []
  const referenceColumnKeys = item.referenceColumnKeys ?? []
  const normalizedResponseFields = responseFields.map(normalizeResponseField)

  function patchItem(patch: Partial<VerificationItemRequest>): void {
    onChange({ ...item, ...patch })
  }

  function appendTokenToPrompt(token: string): string {
    const currentRubric = item.rubric?.trimEnd() ?? ''
    return currentRubric ? `${currentRubric} ${token}` : token
  }

  function insertResponseToken(field: ResponseFieldExampleResponse): void {
    patchItem({
      targetPaths: targetPaths.includes(field.path) ? targetPaths : [...targetPaths, field.path],
      rubric: appendTokenToPrompt(toResponseToken(field.path)),
    })
  }

  function insertDatasetToken(column: SchemaColumnResponse): void {
    patchItem({
      referenceColumnKeys: referenceColumnKeys.includes(column.publicId)
        ? referenceColumnKeys
        : [...referenceColumnKeys, column.publicId],
      rubric: appendTokenToPrompt(`$dataset.${column.columnName}`),
    })
  }

  function handleTemplateChange(templateKey: string): void {
    const templateText = PROMPT_TEMPLATES[templateKey as keyof typeof PROMPT_TEMPLATES]
    if (templateText) {
      patchItem({ rubric: templateText })
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)_280px]">
      <TokenRail
        title="Response field"
        emptyText="Chạy test target để lấy response field."
        items={normalizedResponseFields.map((field) => ({
          key: field.path,
          token: toResponseToken(field.path),
          example: field.example,
          description: 'Trường dữ liệu trích xuất từ phản hồi của mô hình/hệ thống.',
          selected: targetPaths.includes(field.path),
          onInsert: () => insertResponseToken(field),
        }))}
      />

      <Field>
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <FieldLabel className="text-xs font-semibold m-0">Prompt LLM Judge</FieldLabel>
          
          <Select onValueChange={handleTemplateChange}>
            <SelectTrigger className="h-7 text-[11px] rounded-md border-dashed bg-muted/30 px-2.5 max-w-[200px] border-border/80">
              <SelectValue placeholder="✨ Chọn Prompt mẫu..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="accuracy">🎯 Đánh giá độ chính xác (Accuracy)</SelectItem>
              <SelectItem value="fluency">💬 Đánh giá trôi chảy & giọng điệu</SelectItem>
              <SelectItem value="hallucination">🛡️ Kiểm tra bịa đặt (Hallucination)</SelectItem>
              <SelectItem value="conciseness">⚡ Kiểm tra độ ngắn gọn/súc tích</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Textarea
          value={item.rubric ?? ''}
          onChange={(event) => patchItem({ rubric: event.target.value })}
          className="min-h-[360px] rounded-lg font-mono text-xs leading-relaxed"
          placeholder={
            'Bạn là QC/Tester. Dựa vào câu trả lời của bot $response.answer và dữ liệu kỳ vọng $dataset.ground_truth, hãy chấm mức độ đúng nghiệp vụ, đầy đủ ý, đúng tone. Trả về điểm 0-1 và lý do ngắn gọn.'
          }
        />
        <div className="rounded-md bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          Bấm token hai bên để chèn vào prompt. Backend lưu prompt này để runner đưa vào LLM Judge.
        </div>
      </Field>

      <TokenRail
        title="Dataset schema"
        emptyText="Chưa có dataset schema."
        items={columns.map((column) => ({
          key: column.publicId,
          token: `$dataset.${column.columnName}`,
          example: column.sampleValue,
          description: `Vai trò: ${column.role} | Kiểu dữ liệu: ${column.dataType}`,
          selected: referenceColumnKeys.includes(column.publicId),
          onInsert: () => insertDatasetToken(column),
        }))}
      />
    </div>
  )
}

interface TokenRailItem {
  key: string
  token: string
  example?: string | null
  description?: string | null
  selected: boolean
  onInsert: () => void
}

function TokenRail({
  title,
  emptyText,
  items,
}: {
  title: string
  emptyText: string
  items: TokenRailItem[]
}): ReactElement {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredItems = items.filter((item) => {
    const query = searchQuery.toLowerCase()
    return (
      item.token.toLowerCase().includes(query) ||
      (item.example && item.example.toLowerCase().includes(query)) ||
      (item.description && item.description.toLowerCase().includes(query))
    )
  })

  return (
    <div className="rounded-lg border bg-muted/20 p-3 flex flex-col min-w-0">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h4 className="text-xs font-semibold uppercase text-muted-foreground truncate">{title}</h4>
        <Badge variant="outline">{items.filter((item) => item.selected).length}</Badge>
      </div>

      <div className="relative mb-3">
        <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          placeholder="Tìm kiếm..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-8 pl-8 pr-3 text-xs rounded-lg"
        />
      </div>

      <div className="flex max-h-[430px] flex-col gap-2 overflow-auto pr-1">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <div key={item.key} className="flex items-center gap-1.5 min-w-0">
              <Button
                type="button"
                variant={item.selected ? 'default' : 'outline'}
                className="h-auto flex-1 justify-start rounded-lg px-3 py-2 text-left min-w-0"
                onClick={item.onInsert}
              >
                <span className="min-w-0 w-full">
                  <span className="block truncate font-mono text-xs">{item.token}</span>
                  {item.example ? (
                    <span className="mt-0.5 block truncate text-[10px] opacity-70">{item.example}</span>
                  ) : null}
                </span>
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 rounded-lg hover:bg-muted/80 text-muted-foreground"
                  >
                    <Eye className="size-3.5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="top" align="end" className="w-80 p-3">
                  <div className="space-y-2.5">
                    <div>
                      <div className="font-mono text-xs font-semibold text-primary">{item.token}</div>
                      {item.description ? (
                        <div className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                          {item.description}
                        </div>
                      ) : null}
                    </div>
                    {item.example ? (
                      <div className="space-y-1">
                        <div className="text-[10px] font-semibold uppercase text-muted-foreground">Ví dụ dữ liệu:</div>
                        <pre className="max-h-36 overflow-auto rounded bg-muted/50 p-2 font-mono text-[10px] leading-relaxed break-all whitespace-pre-wrap">
                          {item.example}
                        </pre>
                      </div>
                    ) : (
                      <div className="text-[10px] italic text-muted-foreground">Không có dữ liệu ví dụ.</div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          ))
        ) : (
          <div className="rounded-md border border-dashed bg-background px-3 py-6 text-center text-xs text-muted-foreground">
            {searchQuery ? 'Không tìm thấy kết quả' : emptyText}
          </div>
        )}
      </div>
    </div>
  )
}

function normalizeResponseField(field: string | ResponseFieldExampleResponse): ResponseFieldExampleResponse {
  return typeof field === 'string' ? { path: field, example: null } : field
}

function toResponseToken(path: string): string {
  if (path.startsWith('$.')) {
    return `$response.${path.slice(2)}`
  }
  if (path.startsWith('$')) {
    return `$response.${path.slice(1)}`
  }
  return `$response.${path}`
}
