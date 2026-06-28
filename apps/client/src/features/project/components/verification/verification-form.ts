import { z } from 'zod'

import type {
  CheckOperator,
  FieldAssertionRequest,
  OperatorCatalogResponse,
  SaveVerificationRequest,
  VerificationItemRequest,
  VerificationItemResponse,
  VerificationItemType,
  VerificationMode,
} from '@/types/config'

export type VerificationFormValues = SaveVerificationRequest

export const MODE_OPTIONS: Array<{
  value: VerificationMode
  label: string
  description: string
}> = [
  {
    value: 'FIELD_CHECKS',
    label: 'So khớp trường dữ liệu',
    description: 'Kiểm tra response bằng các điều kiện xác định.',
  },
  {
    value: 'LLM_JUDGE',
    label: 'AI chấm bằng prompt',
    description: 'Chấm kết quả bằng một prompt LLM Judge.',
  },
  {
    value: 'COMBINED',
    label: 'Kết hợp',
    description: 'Kết hợp rule và AI Judge.',
  },
]

export const ITEM_TYPE_LABELS: Record<VerificationItemType, string> = {
  FIELD_ASSERTION: 'Rule',
  LLM_JUDGE: 'AI Judge',
}

const fieldAssertionSchema = z.object({
  publicId: z.string().nullable().optional(),
  actualPath: z.string(),
  operator: z.string(),
  expectedColumnKey: z.string().nullable(),
})

const itemSchema = z.discriminatedUnion('type', [
  z.object({
    publicId: z.string().nullable().optional(),
    type: z.literal('FIELD_ASSERTION'),
    fieldAssertion: fieldAssertionSchema,
    targetPaths: z.array(z.string()).nullable().optional(),
    referenceColumnKeys: z.array(z.string()).nullable().optional(),
    rubric: z.string().nullable().optional(),
  }),
  z.object({
    publicId: z.string().nullable().optional(),
    type: z.literal('LLM_JUDGE'),
    fieldAssertion: fieldAssertionSchema.nullable().optional(),
    targetPaths: z.array(z.string()),
    referenceColumnKeys: z.array(z.string()),
    rubric: z.string(),
  }),
])

export const verificationFormSchema = z.object({
  mode: z.enum(['FIELD_CHECKS', 'LLM_JUDGE', 'COMBINED']),
  items: z.array(itemSchema).nullable().optional(),
})

export function createFieldAssertion(): FieldAssertionRequest {
  return {
    publicId: null,
    actualPath: '',
    operator: 'EQUALS',
    expectedColumnKey: null,
  }
}

export function createFieldItem(): VerificationItemRequest {
  return {
    publicId: null,
    type: 'FIELD_ASSERTION',
    fieldAssertion: createFieldAssertion(),
    targetPaths: null,
    referenceColumnKeys: null,
    rubric: null,
  }
}

export function createLlmItem(): VerificationItemRequest {
  return {
    publicId: null,
    type: 'LLM_JUDGE',
    fieldAssertion: null,
    targetPaths: [],
    referenceColumnKeys: [],
    rubric:
      'Bạn là QC/Tester. Dựa vào câu trả lời của bot $response.answer và dữ liệu kỳ vọng $dataset.ground_truth, hãy chấm câu trả lời theo tiêu chí nghiệp vụ. Trả về điểm 0-1 và lý do ngắn gọn.',
  }
}

export function normalizeResponseItem(item: VerificationItemResponse): VerificationItemRequest {
  return {
    publicId: item.publicId,
    type: item.type,
    fieldAssertion: item.fieldAssertion
      ? {
          ...item.fieldAssertion,
          publicId: item.fieldAssertion.publicId,
        }
      : null,
    targetPaths: item.targetPaths,
    referenceColumnKeys: item.referenceColumnKeys,
    rubric: item.rubric,
  }
}

export function itemCompatibleWithMode(
  item: VerificationItemRequest,
  mode: VerificationMode,
): boolean {
  if (mode === 'COMBINED') {
    return true
  }
  if (mode === 'FIELD_CHECKS') {
    return item.type === 'FIELD_ASSERTION'
  }
  return item.type === 'LLM_JUDGE'
}

export function filterItemsForMode(
  items: VerificationItemRequest[],
  mode: VerificationMode,
): VerificationItemRequest[] {
  return items.filter((item) => itemCompatibleWithMode(item, mode))
}

export function prepareSubmitValues(values: VerificationFormValues): SaveVerificationRequest {
  const compatibleItems = filterItemsForMode(values.items ?? [], values.mode)
  return {
    mode: values.mode,
    items: compatibleItems.map((item) => ({
      ...item,
      fieldAssertion: item.type === 'FIELD_ASSERTION' ? item.fieldAssertion : null,
    })),
  }
}

export function validateVerificationForm(
  values: VerificationFormValues,
  operatorCatalog: OperatorCatalogResponse[] | undefined,
): string[] {
  const structural = verificationFormSchema.safeParse(values)
  const errors: string[] = []
  if (!structural.success) {
    errors.push('Cấu hình chưa đúng định dạng. Vui lòng kiểm tra lại các trường bắt buộc.')
  }

  const items = filterItemsForMode(values.items ?? [], values.mode)
  if (items.length === 0) {
    errors.push('Cần có ít nhất một verification item.')
  }

  const operatorMap = new Map(operatorCatalog?.map((operator) => [operator.operator, operator]))
  for (const item of items) {
    if (item.type === 'FIELD_ASSERTION' && item.fieldAssertion) {
      validateAssertion(item.fieldAssertion, operatorMap, errors)
    }
    if (item.type === 'LLM_JUDGE' && !item.rubric?.trim()) {
      errors.push('LLM Judge cần prompt.')
    }
  }
  return [...new Set(errors)]
}

function validateAssertion(
  assertion: FieldAssertionRequest,
  operatorMap: Map<CheckOperator, OperatorCatalogResponse>,
  errors: string[],
): void {
  if (!assertion.actualPath.trim()) {
    errors.push('Mỗi rule cần chọn trường response.')
  }
  if (!operatorMap.has(assertion.operator)) {
    errors.push(`Operator "${assertion.operator}" không hợp lệ.`)
  }
  if (!assertion.expectedColumnKey) {
    errors.push(`Rule "${assertion.actualPath || assertion.operator}" cần chọn cột dataset.`)
  }
}
