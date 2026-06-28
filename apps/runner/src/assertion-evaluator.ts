import type {
  CheckOperator,
  EvalRunRequest,
  FieldAssertionPayload,
  RunnerAssertionResult,
  VerificationItemPayload,
} from './types.js';
import { readPath } from './json.js';

export class AssertionEvaluator {
  public evaluate(
    request: EvalRunRequest,
    rowData: Record<string, unknown>,
    actualOutput: unknown,
  ): RunnerAssertionResult[] {
    const columnNamesByKey = new Map(request.schemaColumns.map((column) => [column.publicId, column.columnName]));
    return request.verification.items.map((item) => this.evaluateItem(item, rowData, actualOutput, columnNamesByKey));
  }

  private evaluateItem(
    item: VerificationItemPayload,
    rowData: Record<string, unknown>,
    actualOutput: unknown,
    columnNamesByKey: Map<string, string>,
  ): RunnerAssertionResult {
    if (item.fieldAssertion) {
      return this.evaluateFieldAssertion(item.fieldAssertion, rowData, actualOutput, columnNamesByKey);
    }

    return {
      assertionName: 'LLM_JUDGE',
      assertionType: item.type,
      responsePath: null,
      passed: true,
      score: 1,
      reason: 'LLM judge is deferred in Redis mapping MVP.',
      expectedValue: null,
      actualValue: this.toNullableString(actualOutput),
    };
  }

  private evaluateFieldAssertion(
    assertion: FieldAssertionPayload,
    rowData: Record<string, unknown>,
    actualOutput: unknown,
    columnNamesByKey: Map<string, string>,
  ): RunnerAssertionResult {
    const actual = readPath(actualOutput, assertion.actualPath);
    const expectedColumn = columnNamesByKey.get(assertion.expectedColumnKey);
    const expected = expectedColumn ? rowData[expectedColumn] : rowData[assertion.expectedColumnKey];
    const passed = this.compare(assertion.operator, actual, expected);
    return {
      assertionName: assertion.operator,
      assertionType: 'FIELD_ASSERTION',
      responsePath: assertion.actualPath,
      passed,
      score: passed ? 1 : 0,
      reason: passed ? 'Assertion passed.' : 'Assertion failed.',
      expectedValue: this.toNullableString(expected),
      actualValue: this.toNullableString(actual),
    };
  }

  private compare(operator: CheckOperator, actual: unknown, expected: unknown): boolean {
    const actualText = this.toString(actual);
    const expectedText = this.toString(expected);
    switch (operator) {
      case 'EQUALS':
        return actualText === expectedText;
      case 'NOT_EQUALS':
        return actualText !== expectedText;
      case 'CONTAINS':
        return actualText.includes(expectedText);
      case 'NOT_CONTAINS':
        return !actualText.includes(expectedText);
      case 'REGEX':
        return new RegExp(expectedText).test(actualText);
      case 'GREATER_THAN':
        return Number(actual) > Number(expected);
      case 'GREATER_THAN_OR_EQUALS':
        return Number(actual) >= Number(expected);
      case 'LESS_THAN':
        return Number(actual) < Number(expected);
      case 'LESS_THAN_OR_EQUALS':
        return Number(actual) <= Number(expected);
      default:
        return this.assertNever(operator);
    }
  }

  private toNullableString(value: unknown): string | null {
    return value == null ? null : this.toString(value);
  }

  private toString(value: unknown): string {
    return typeof value === 'string' ? value : JSON.stringify(value);
  }

  private assertNever(value: never): never {
    throw new Error(`Unsupported operator: ${String(value)}`);
  }
}
