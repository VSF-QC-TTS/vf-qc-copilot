import type { CallApiFunction, EvaluateTestSuite, ProviderResponse } from 'promptfoo';
import type { EvalRunRequest } from './types.js';
import type { TargetCaller, TargetCallResult } from './target-client.js';
import { stringifyJson } from './json.js';
import { VerificationMapper } from './verification-mapper.js';

export interface BuiltPromptfooSuite {
  suite: EvaluateTestSuite;
  getTargetResult: () => TargetCallResult | null;
}

export class PromptfooSuiteBuilder {
  public constructor(
    private readonly targetClient: TargetCaller,
    private readonly verificationMapper = new VerificationMapper(),
  ) {}

  public build(request: EvalRunRequest, rowData: Record<string, unknown>): BuiltPromptfooSuite {
    let targetResult: TargetCallResult | null = null;
    const provider: CallApiFunction = async (): Promise<ProviderResponse> => {
      try {
        targetResult = await this.targetClient.callTarget(request.targetConfig, rowData);
        return {
          output: targetResult.output,
          raw: targetResult.rawResponse,
          metadata: {
            latencyMs: targetResult.latencyMs,
          },
        };
      } catch (error: unknown) {
        return {
          error: error instanceof Error ? error.message : 'Unknown target execution error',
        };
      }
    };
    provider.label = 'vfqc-target-provider';

    return {
      suite: {
        prompts: ['{{__vfqc_input}}'],
        providers: [provider],
        tests: [
          {
            vars: {
              __vfqc_input: stringifyJson(rowData),
              ...rowData,
            },
            assert: this.verificationMapper.toPromptfooAssertions(request, rowData),
          },
        ],
      },
      getTargetResult: () => targetResult,
    };
  }
}
