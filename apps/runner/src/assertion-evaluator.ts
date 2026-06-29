import promptfoo from 'promptfoo';
import type { CallApiFunction, EvaluateResult, ProviderResponse } from 'promptfoo';
import type {
  EvalRunRequest,
  RunnerAssertionResult,
} from './types.js';
import { ResultMapper } from './result-mapper.js';
import { VerificationMapper } from './verification-mapper.js';

export class AssertionEvaluator {
  public constructor(
    private readonly verificationMapper = new VerificationMapper(),
    private readonly resultMapper = new ResultMapper(),
  ) {}

  public async evaluate(
    request: EvalRunRequest,
    rowData: Record<string, unknown>,
    actualOutput: unknown,
  ): Promise<RunnerAssertionResult[]> {
    const provider: CallApiFunction = async (): Promise<ProviderResponse> => ({ output: actualOutput });
    provider.label = 'vfqc-assertion-output-provider';
    const evalRecord = await promptfoo.evaluate(
      {
        prompts: ['{{__vfqc_output}}'],
        providers: [provider],
        tests: [
          {
            vars: {
              __vfqc_output: typeof actualOutput === 'string' ? actualOutput : JSON.stringify(actualOutput ?? {}),
              ...rowData,
            },
            assert: this.verificationMapper.toPromptfooAssertions(request, rowData),
          },
        ],
      },
      {
        maxConcurrency: 1,
        showProgressBar: false,
      },
    );
    const summary = await evalRecord.toEvaluateSummary();
    const result = (summary.results?.[0] ?? null) as EvaluateResult | null;
    return this.resultMapper.mapAssertions(result, request.verification.items, actualOutput);
  }
}
