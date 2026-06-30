import type { CallApiFunction, EvaluateTestSuite, ProviderResponse, ProviderOptions } from 'promptfoo';
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

    const providers: (CallApiFunction | ProviderOptions)[] = [provider];
    let prompts = ['{{__vfqc_input}}'];

    if (request.runType === 'COMPARISON' && request.compareData?.configs) {
      prompts = [request.compareData.promptTemplate];
      for (const config of request.compareData.configs) {
        let providerId = '';
        if (config.provider === 'OPENAI') {
          providerId = `openai:chat:${config.model}`;
        } else if (config.provider === 'GEMINI') {
          providerId = `google:${config.model}`;
        } else if (config.provider === 'ANTHROPIC') {
          providerId = `anthropic:messages:${config.model}`;
        } else if (config.provider === 'AZURE_OPENAI') {
          providerId = `azure:chat:${config.model}`;
        } else {
          providerId = `${config.provider.toLowerCase()}:${config.model}`;
        }

        providers.push({
          id: providerId,
          label: config.name,
          config: {
            apiKey: config.apiKey,
          },
        });
      }
    }

    return {
      suite: {
        prompts,
        providers,
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
