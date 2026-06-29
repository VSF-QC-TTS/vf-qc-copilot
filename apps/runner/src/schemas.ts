import { z } from 'zod';

const nullableStringSchema = z.string().nullable().optional();

const targetConfigSchema = z.object({
  method: z.string().min(1),
  url: z.string().min(1),
  headers: nullableStringSchema,
  queryParams: nullableStringSchema,
  bodyTemplate: nullableStringSchema,
  responsePath: nullableStringSchema,
  timeoutMs: z.number().int().positive().nullable().optional(),
  secrets: z.record(z.string(), z.string()),
});

const aiConfigSchema = z.object({
  provider: z.string().min(1),
  baseUrl: nullableStringSchema,
  evaluationModel: z.string().min(1),
  temperature: z.number().nullable().optional(),
  maxTokens: z.number().int().positive().nullable().optional(),
  timeoutMs: z.number().int().positive().nullable().optional(),
  retryCount: z.number().int().nonnegative().nullable().optional(),
  apiKey: nullableStringSchema,
});

const datasetRowSchema = z.object({
  publicId: z.string().min(1),
  internalId: z.number(),
  rowIndex: z.number().int().nonnegative(),
  data: z.string(),
});

const schemaColumnSchema = z.object({
  publicId: z.string().min(1),
  columnName: z.string().min(1),
  dataType: z.string().min(1),
  role: z.string().min(1),
});

const fieldAssertionSchema = z.object({
  actualPath: z.string().min(1),
  operator: z.enum([
    'EQUALS',
    'NOT_EQUALS',
    'CONTAINS',
    'NOT_CONTAINS',
    'REGEX',
    'GREATER_THAN',
    'GREATER_THAN_OR_EQUALS',
    'LESS_THAN',
    'LESS_THAN_OR_EQUALS',
  ]),
  expectedColumnKey: z.string().min(1),
});

const verificationItemSchema = z.object({
  publicId: z.string().min(1),
  internalId: z.number(),
  type: z.enum(['FIELD_ASSERTION', 'LLM_JUDGE']),
  targetPaths: nullableStringSchema,
  referenceColumnKeys: nullableStringSchema,
  rubric: nullableStringSchema,
  fieldAssertion: fieldAssertionSchema.nullable().optional(),
});

const verificationSchema = z.object({
  mode: z.enum(['FIELD_CHECKS', 'LLM_JUDGE', 'COMBINED']),
  version: z.number().int(),
  items: z.array(verificationItemSchema),
});

export const evalRunRequestSchema = z.object({
  runId: z.string().min(1),
  internalRunId: z.number(),
  targetConfig: targetConfigSchema,
  aiConfig: aiConfigSchema.nullable().optional(),
  datasetRows: z.array(datasetRowSchema),
  schemaColumns: z.array(schemaColumnSchema),
  verification: verificationSchema,
});

export const cancelStatusSchema = z.object({
  cancellationRequested: z.boolean(),
});

export const redisRunJobFieldsSchema = z.object({
  runId: z.string().min(1),
});

export function parseWithSchema<T>(schema: z.ZodType<T>, value: unknown, label: string): T {
  const parsed = schema.safeParse(value);
  if (parsed.success) {
    return parsed.data;
  }
  throw new Error(`${label} validation failed: ${parsed.error.message}`);
}
