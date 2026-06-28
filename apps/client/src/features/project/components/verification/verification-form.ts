import { z } from 'zod'

import type {
  CheckOperator,
  ExpectedSource,
  FieldAggregation,
  FieldAssertionRequest,
  LlmCriterionRequest,
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
    label: 'AI chấm theo tiêu chí',
    description: 'Chấm từng tiêu chí bằng LLM Judge.',
  },
  {
    value: 'COMBINED',
    label: 'Kết hợp',
    description: 'Kết hợp rule, group và AI Judge.',
  },
]

export const AGGREGATION_LABELS: Record<FieldAggregation, string> = {
  ALL: 'Tất cả điều kiện đúng',
  ANY: 'Chỉ cần một điều kiện đúng',
  AT_LEAST: 'Đạt tối thiểu N điều kiện',
  AVERAGE: 'Điểm trung bình đạt ngưỡng',
}

export const ITEM_TYPE_LABELS: Record<VerificationItemType, string> = {
  FIELD_ASSERTION: 'Rule',
  FIELD_ASSERTION_GROUP: 'Group',
  LLM_JUDGE: 'AI Judge',
}

const expectedSchema = z.object({
  source: z.literal('DATASET_COLUMN'),
  columnKey: z.string().nullable(),
  value: z.string().nullable(),
  template: z.string().nullable(),
})

const fieldAssertionSchema = z.object({
  publicId: z.string().nullable().optional(),
  actualPath: z.string(),
  operator: z.string(),
  expected: expectedSchema.nullable().optional(),
  threshold: z.coerce.number().min(0).max(1).nullable().optional(),
  weight: z.coerce.number().min(0),
  enabled: z.boolean(),
  displayOrder: z.number(),
})

const llmCriterionSchema = z.object({
  publicId: z.string().nullable().optional(),
  name: z.string(),
  description: z.string(),
  weight: z.coerce.number().min(0),
  enabled: z.boolean(),
  displayOrder: z.number(),
})

const itemSchema = z.discriminatedUnion('type', [
  z.object({
    publicId: z.string().nullable().optional(),
    type: z.literal('FIELD_ASSERTION'),
    name: z.string(),
    enabled: z.boolean(),
    critical: z.boolean(),
    weight: z.coerce.number().min(0),
    threshold: z.coerce.number().min(0).max(1).nullable().optional(),
    displayOrder: z.number(),
    aggregation: z.null().optional(),
    minPassCount: z.null().optional(),
    fieldAssertion: fieldAssertionSchema,
    fieldAssertions: z.array(fieldAssertionSchema).nullable().optional(),
    targetPaths: z.array(z.string()).nullable().optional(),
    referenceColumnKeys: z.array(z.string()).nullable().optional(),
    rubric: z.null().optional(),
    criteria: z.array(llmCriterionSchema).nullable().optional(),
  }),
  z.object({
    publicId: z.string().nullable().optional(),
    type: z.literal('FIELD_ASSERTION_GROUP'),
    name: z.string(),
    enabled: z.boolean(),
    critical: z.boolean(),
    weight: z.coerce.number().min(0),
    threshold: z.coerce.number().min(0).max(1).nullable().optional(),
    displayOrder: z.number(),
    aggregation: z.enum(['ALL', 'ANY', 'AT_LEAST', 'AVERAGE']),
    minPassCount: z.coerce.number().nullable().optional(),
    fieldAssertion: fieldAssertionSchema.nullable().optional(),
    fieldAssertions: z.array(fieldAssertionSchema),
    targetPaths: z.array(z.string()).nullable().optional(),
    referenceColumnKeys: z.array(z.string()).nullable().optional(),
    rubric: z.null().optional(),
    criteria: z.array(llmCriterionSchema).nullable().optional(),
  }),
  z.object({
    publicId: z.string().nullable().optional(),
    type: z.literal('LLM_JUDGE'),
    name: z.string(),
    enabled: z.boolean(),
    critical: z.boolean(),
    weight: z.coerce.number().min(0),
    threshold: z.coerce.number().min(0).max(1).nullable().optional(),
    displayOrder: z.number(),
    aggregation: z.null().optional(),
    minPassCount: z.null().optional(),
    fieldAssertion: fieldAssertionSchema.nullable().optional(),
    fieldAssertions: z.array(fieldAssertionSchema).nullable().optional(),
    targetPaths: z.array(z.string()),
    referenceColumnKeys: z.array(z.string()),
    rubric: z.string(),
    criteria: z.array(llmCriterionSchema).nullable().optional(),
  }),
])

export const verificationFormSchema = z.object({
  mode: z.enum(['FIELD_CHECKS', 'LLM_JUDGE', 'COMBINED']),
  threshold: z.coerce.number().min(0).max(1),
  items: z.array(itemSchema).nullable().optional(),
})

export function defaultExpectedValue(): {
  source: ExpectedSource
  columnKey: string | null
  value: string | null
  template: string | null
} {
  return {
    source: 'DATASET_COLUMN',
    columnKey: null,
    value: null,
    template: null,
  }
}

export function createFieldAssertion(displayOrder: number): FieldAssertionRequest {
  return {
    publicId: null,
    actualPath: '',
    operator: 'EQUALS',
    expected: defaultExpectedValue(),
    threshold: null,
    weight: 1,
    enabled: true,
    displayOrder,
  }
}

export function createCriterion(displayOrder: number): LlmCriterionRequest {
  return {
    publicId: null,
    name: displayOrder === 0 ? 'Correctness' : '',
    description: displayOrder === 0 ? 'Câu trả lời đúng theo dữ liệu kỳ vọng.' : '',
    weight: 1,
    enabled: true,
    displayOrder,
  }
}

export function createFieldItem(displayOrder: number): VerificationItemRequest {
  return {
    publicId: null,
    type: 'FIELD_ASSERTION',
    name: 'Kiểm tra một trường',
    enabled: true,
    critical: false,
    weight: 1,
    threshold: null,
    displayOrder,
    aggregation: null,
    minPassCount: null,
    fieldAssertion: createFieldAssertion(0),
    fieldAssertions: null,
    targetPaths: null,
    referenceColumnKeys: null,
    rubric: null,
    criteria: null,
  }
}

export function createGroupItem(displayOrder: number): VerificationItemRequest {
  return {
    publicId: null,
    type: 'FIELD_ASSERTION_GROUP',
    name: 'Nhóm điều kiện',
    enabled: true,
    critical: false,
    weight: 1,
    threshold: null,
    displayOrder,
    aggregation: 'ALL',
    minPassCount: null,
    fieldAssertion: null,
    fieldAssertions: [createFieldAssertion(0)],
    targetPaths: null,
    referenceColumnKeys: null,
    rubric: null,
    criteria: null,
  }
}

export function createLlmItem(displayOrder: number): VerificationItemRequest {
  return {
    publicId: null,
    type: 'LLM_JUDGE',
    name: 'AI chấm chất lượng câu trả lời',
    enabled: true,
    critical: false,
    weight: 1,
    threshold: 0.7,
    displayOrder,
    aggregation: null,
    minPassCount: null,
    fieldAssertion: null,
    fieldAssertions: null,
    targetPaths: [],
    referenceColumnKeys: [],
    rubric:
      'Bạn là QC/Tester. Dựa vào câu trả lời của bot $response.answer và dữ liệu kỳ vọng $dataset.ground_truth, hãy chấm câu trả lời theo tiêu chí nghiệp vụ. Trả về điểm 0-1 và lý do ngắn gọn.',
    criteria: [],
  }
}

export function normalizeResponseItem(item: VerificationItemResponse): VerificationItemRequest {
  return {
    publicId: item.publicId,
    type: item.type,
    name: item.name,
    enabled: item.enabled,
    critical: item.critical,
    weight: item.weight,
    threshold: item.threshold,
    displayOrder: item.displayOrder,
    aggregation: item.aggregation,
    minPassCount: item.minPassCount,
    fieldAssertion: item.fieldAssertion
      ? {
          ...item.fieldAssertion,
          publicId: item.fieldAssertion.publicId,
        }
      : null,
    fieldAssertions: (item.fieldAssertions ?? []).map((assertion) => ({
      ...assertion,
      publicId: assertion.publicId,
    })),
    targetPaths: item.targetPaths,
    referenceColumnKeys: item.referenceColumnKeys,
    rubric: item.rubric,
    criteria: (item.criteria ?? []).map((criterion) => ({
      ...criterion,
      publicId: criterion.publicId,
    })),
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
    return item.type === 'FIELD_ASSERTION' || item.type === 'FIELD_ASSERTION_GROUP'
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
    threshold: values.threshold,
    items: compatibleItems.map((item, displayOrder) => ({
      ...item,
      displayOrder,
      fieldAssertion:
        item.type === 'FIELD_ASSERTION' && item.fieldAssertion
          ? { ...item.fieldAssertion, displayOrder: 0 }
          : null,
      fieldAssertions:
        item.type === 'FIELD_ASSERTION_GROUP'
          ? (item.fieldAssertions ?? []).map((assertion, childOrder) => ({
              ...assertion,
              displayOrder: childOrder,
            }))
          : null,
      criteria:
        item.type === 'LLM_JUDGE'
          ? (item.criteria ?? []).map((criterion, childOrder) => ({
              ...criterion,
              displayOrder: childOrder,
            }))
          : null,
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
  if (items.filter((item) => item.enabled).length === 0) {
    errors.push('Cần có ít nhất một tiêu chí đang bật.')
  }

  const operatorMap = new Map(operatorCatalog?.map((operator) => [operator.operator, operator]))
  for (const item of items) {
    if (!item.name.trim()) {
      errors.push('Mỗi tiêu chí cần có tên.')
    }
    if (item.type === 'FIELD_ASSERTION' && item.fieldAssertion) {
      validateAssertion(item.fieldAssertion, operatorMap, errors)
    }
    if (item.type === 'FIELD_ASSERTION_GROUP') {
      const assertions = item.fieldAssertions ?? []
      if (assertions.filter((assertion) => assertion.enabled).length === 0) {
        errors.push(`Nhóm "${item.name}" cần ít nhất một điều kiện đang bật.`)
      }
      if (item.aggregation === 'AT_LEAST') {
        const enabledCount = assertions.filter((assertion) => assertion.enabled).length
        if (!item.minPassCount || item.minPassCount < 1 || item.minPassCount > enabledCount) {
          errors.push(`Nhóm "${item.name}" cần số điều kiện tối thiểu hợp lệ.`)
        }
      }
      for (const assertion of assertions) {
        validateAssertion(assertion, operatorMap, errors)
      }
    }
    if (item.type === 'LLM_JUDGE') {
      if (!item.rubric?.trim()) {
        errors.push(`AI Judge "${item.name}" cần prompt.`)
      }
    }
  }
  return [...new Set(errors)]
}

function validateAssertion(
  assertion: FieldAssertionRequest,
  operatorMap: Map<CheckOperator, OperatorCatalogResponse>,
  errors: string[],
): void {
  if (!assertion.enabled) {
    return
  }
  if (!assertion.actualPath.trim()) {
    errors.push('Mỗi rule đang bật cần chọn trường response.')
  }
  const operator = operatorMap.get(assertion.operator)
  const requiresExpected = operator?.requiresExpected ?? !['NOT_EMPTY', 'IS_JSON'].includes(assertion.operator)
  if (!requiresExpected) {
    errors.push(`Rule "${assertion.actualPath || assertion.operator}" phải so sánh với một cột dataset.`)
    return
  }
  const expected = assertion.expected
  if (!expected) {
    errors.push(`Rule "${assertion.actualPath || assertion.operator}" cần dữ liệu kỳ vọng.`)
    return
  }
  if (expected.source !== 'DATASET_COLUMN') {
    errors.push(`Rule "${assertion.actualPath || assertion.operator}" chỉ được so với cột dataset.`)
    return
  }
  if (expected.source === 'DATASET_COLUMN' && !expected.columnKey) {
    errors.push(`Rule "${assertion.actualPath || assertion.operator}" cần chọn cột dataset.`)
  }
}
