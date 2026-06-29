import type { EvaluateResult, GradingResult } from 'promptfoo';
import type {
  RunnerAssertionResult,
  VerificationItemPayload,
} from './types.js';
import type { FieldAssertionMetadata } from './verification-mapper.js';

const MAX_VALUE_LENGTH = 2000;

export class ResultMapper {
  public mapAssertions(
    result: EvaluateResult | null,
    items: VerificationItemPayload[],
    output: unknown,
  ): RunnerAssertionResult[] {
    const outputText = this.stringifyValue(output);
    const gradingResult = result?.gradingResult ?? null;
    const componentResults = gradingResult?.componentResults ?? [];

    return items.map((item, index) => {
      const component = componentResults[index] ?? null;
      if (!component) {
        return this.fallbackResult(
          item,
          gradingResult?.reason ?? result?.error ?? 'No component result from promptfoo',
          outputText,
        );
      }
      return this.mapComponent(item, component, outputText);
    });
  }

  public fallbackAssertions(
    items: VerificationItemPayload[],
    reason: string,
    output: unknown,
  ): RunnerAssertionResult[] {
    const outputText = this.stringifyValue(output);
    return items.map((item) => this.fallbackResult(item, reason, outputText));
  }

  private mapComponent(
    item: VerificationItemPayload,
    component: GradingResult,
    outputText: string,
  ): RunnerAssertionResult {
    const metadata = this.fieldMetadata(component);

    return {
      assertionName: this.assertionName(item),
      assertionType: item.type,
      responsePath: (item.fieldAssertion?.actualPath ?? item.targetPaths) ?? null,
      passed: component.pass,
      score: typeof component.score === 'number' ? component.score : component.pass ? 1 : 0,
      reason: component.reason ?? (component.pass ? 'Assertion passed.' : 'Assertion failed.'),
      expectedValue: (item.fieldAssertion ? metadata.expectedValue : item.rubric) ?? null,
      actualValue: item.fieldAssertion ? metadata.actualValue : this.truncate(outputText),
    };
  }

  private fallbackResult(
    item: VerificationItemPayload,
    reason: string,
    outputText: string,
  ): RunnerAssertionResult {
    return {
      assertionName: this.assertionName(item),
      assertionType: item.type,
      responsePath: (item.fieldAssertion?.actualPath ?? item.targetPaths) ?? null,
      passed: false,
      score: 0,
      reason,
      expectedValue: null,
      actualValue: this.truncate(outputText),
    };
  }

  private fieldMetadata(component: GradingResult): FieldAssertionMetadata {
    const metadata = component.metadata ?? {};
    return {
      actualValue: typeof metadata.actualValue === 'string' ? metadata.actualValue : null,
      expectedValue: typeof metadata.expectedValue === 'string' ? metadata.expectedValue : null,
    };
  }

  private assertionName(item: VerificationItemPayload): string {
    return item.fieldAssertion ? item.fieldAssertion.operator : 'LLM_JUDGE';
  }

  private stringifyValue(value: unknown): string {
    if (typeof value === 'string') {
      return value;
    }
    return JSON.stringify(value ?? {});
  }

  private truncate(value: string): string {
    return value.length > MAX_VALUE_LENGTH ? `${value.slice(0, MAX_VALUE_LENGTH)}...` : value;
  }
}
