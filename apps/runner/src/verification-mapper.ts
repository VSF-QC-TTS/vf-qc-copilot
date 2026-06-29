import type { Assertion, GradingResult } from 'promptfoo';
import type {
  AiConfigPayload,
  CheckOperator,
  EvalRunRequest,
  FieldAssertionPayload,
  VerificationItemPayload,
} from './types.js';
import { readPath } from './json.js';

export interface FieldAssertionMetadata {
  actualValue: string | null;
  expectedValue: string | null;
}

export class VerificationMapper {
  public toPromptfooAssertions(
    request: EvalRunRequest,
    rowData: Record<string, unknown>,
  ): Assertion[] {
    const columnNamesByKey = new Map(
      request.schemaColumns.map((column) => [column.publicId, column.columnName]),
    );

    return request.verification.items.map((item) =>
      this.toPromptfooAssertion(item, rowData, columnNamesByKey, request.aiConfig),
    );
  }

  private toPromptfooAssertion(
    item: VerificationItemPayload,
    rowData: Record<string, unknown>,
    columnNamesByKey: Map<string, string>,
    aiConfig: AiConfigPayload | null,
  ): Assertion {
    if (item.fieldAssertion) {
      return this.fieldAssertionToPromptfoo(item.fieldAssertion, rowData, columnNamesByKey);
    }
    return this.llmJudgeToPromptfoo(item, aiConfig);
  }

  private fieldAssertionToPromptfoo(
    assertion: FieldAssertionPayload,
    rowData: Record<string, unknown>,
    columnNamesByKey: Map<string, string>,
  ): Assertion {
    return {
      type: 'javascript',
      value: (_output: string, context): GradingResult => {
        const actual = readPath(context.providerResponse?.output, assertion.actualPath);
        const expectedColumn = columnNamesByKey.get(assertion.expectedColumnKey);
        const expected = expectedColumn
          ? rowData[expectedColumn]
          : rowData[assertion.expectedColumnKey];
        return this.evaluateFieldAssertion(assertion.operator, actual, expected);
      },
    };
  }

  private evaluateFieldAssertion(
    operator: CheckOperator,
    actual: unknown,
    expected: unknown,
  ): GradingResult {
    const actualValue = this.stringifyValue(actual);
    const expectedValue = this.stringifyValue(expected);
    const passed = this.compare(operator, actualValue, expectedValue);

    return {
      pass: passed,
      score: passed ? 1 : 0,
      reason: passed
        ? `${operator} assertion passed.`
        : `${operator} assertion failed: actual=${actualValue ?? ''}, expected=${expectedValue ?? ''}`,
      metadata: {
        actualValue,
        expectedValue,
      } satisfies FieldAssertionMetadata,
    };
  }

  private compare(
    operator: CheckOperator,
    actualValue: string | null,
    expectedValue: string | null,
  ): boolean {
    const actual = actualValue ?? '';
    const expected = expectedValue ?? '';

    switch (operator) {
      case 'EQUALS':
        return actual === expected;
      case 'NOT_EQUALS':
        return actual !== expected;
      case 'CONTAINS':
        return actual.includes(expected);
      case 'NOT_CONTAINS':
        return !actual.includes(expected);
      case 'REGEX':
        return new RegExp(expected).test(actual);
      case 'GREATER_THAN':
        return Number(actual) > Number(expected);
      case 'GREATER_THAN_OR_EQUALS':
        return Number(actual) >= Number(expected);
      case 'LESS_THAN':
        return Number(actual) < Number(expected);
      case 'LESS_THAN_OR_EQUALS':
        return Number(actual) <= Number(expected);
    }
  }

  private llmJudgeToPromptfoo(
    item: VerificationItemPayload,
    aiConfig: AiConfigPayload | null,
  ): Assertion {
    if (!item.rubric?.trim()) {
      return {
        type: 'javascript',
        value: (): GradingResult => ({
          pass: false,
          score: 0,
          reason: 'LLM judge skipped: no rubric provided.',
        }),
      };
    }

    const assertion: Assertion = {
      type: 'llm-rubric',
      value: this.renderRubricTokens(item.rubric),
    };
    const provider = aiConfig ? this.buildGraderProvider(aiConfig) : null;
    if (provider) {
      assertion.provider = provider;
    }
    return assertion;
  }

  private buildGraderProvider(aiConfig: AiConfigPayload): string | null {
    if (!aiConfig.evaluationModel?.trim()) {
      return null;
    }

    const provider = aiConfig.provider.toUpperCase();
    switch (provider) {
      case 'AZURE':
      case 'AZURE_OPENAI':
        return `azureopenai:chat:${aiConfig.evaluationModel}`;
      case 'GEMINI':
        return `google:${aiConfig.evaluationModel}`;
      case 'ANTHROPIC':
        return `anthropic:messages:${aiConfig.evaluationModel}`;
      case 'CUSTOM':
      case 'OPENAI':
        return `openai:chat:${aiConfig.evaluationModel}`;
      default:
        return `openai:chat:${aiConfig.evaluationModel}`;
    }
  }

  private renderRubricTokens(rubric: string): string {
    const tokenPath = '([A-Za-z0-9_-]+(?:\\.[A-Za-z0-9_-]+)*)';
    return rubric
      .replace(new RegExp(`\\$dataset\\.${tokenPath}`, 'g'), '{{ $1 }}')
      .replace(new RegExp(`\\$input\\.${tokenPath}`, 'g'), '{{ $1 }}')
      .replace(new RegExp(`\\$response\\.${tokenPath}`, 'g'), 'response.$1');
  }

  private stringifyValue(value: unknown): string | null {
    if (value == null) {
      return null;
    }
    return typeof value === 'string' ? value : JSON.stringify(value);
  }
}
