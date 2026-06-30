import promptfoo from 'promptfoo';
import type { EvaluateResult } from 'promptfoo';
import { logger } from './logger.js';
import type { EvalRunRequest, RunnerAssertionResult } from './types.js';
import { ResultMapper } from './result-mapper.js';
import { TargetClient, type TargetCallResult, type TargetCaller } from './target-client.js';
import { PromptfooSuiteBuilder } from './promptfoo-suite-builder.js';

export interface PromptfooRowExecution {
  output: unknown;
  rawResponse: unknown;
  latencyMs: number;
  assertions: RunnerAssertionResult[];
}

export class PromptfooExecutor {
  public constructor(
    targetClient: TargetCaller = new TargetClient(),
    private readonly resultMapper = new ResultMapper(),
    private readonly suiteBuilder = new PromptfooSuiteBuilder(targetClient),
  ) {}

  public async executeRow(
    request: EvalRunRequest,
    rowData: Record<string, unknown>,
  ): Promise<PromptfooRowExecution> {
    this.configureGraderEnv(request.aiConfig);
    const builtSuite = this.suiteBuilder.build(request, rowData);

    logger.info(
      { assertionCount: request.verification.items.length, mode: request.verification.mode },
      'Running promptfoo evaluation',
    );

    const evalRecord = await promptfoo.evaluate(builtSuite.suite, {
      maxConcurrency: 1,
      showProgressBar: false,
    });
    const summary = await evalRecord.toEvaluateSummary();
    
    // The first result is typically the target provider unless it failed to initialize.
    // We explicitly find it by label:
    const targetResultObj = summary.results?.find(r => r.provider.label === 'vfqc-target-provider') ?? summary.results?.[0] ?? null;
    const targetResult = builtSuite.getTargetResult();

    this.throwIfTargetFailed(targetResultObj as EvaluateResult | null, targetResult);

    const output = targetResult?.output ?? targetResultObj?.response?.output ?? {};
    
    // Normal assertions for the target provider
    const assertions = this.resultMapper.mapAssertions(targetResultObj as EvaluateResult | null, request.verification.items, output);

    // If it's a comparison run, extract the other providers' results as well
    if (request.runType === 'COMPARISON' && summary.results) {
      const compareEvals = summary.results.filter(r => r.provider.label !== 'vfqc-target-provider');
      for (const evalRes of compareEvals) {
        const outStr = typeof evalRes.response?.output === 'string' 
          ? evalRes.response.output 
          : JSON.stringify(evalRes.response?.output ?? '');
          
        assertions.push({
          assertionName: evalRes.provider.label || evalRes.provider.id || 'Unknown LLM',
          assertionType: 'LLM_COMPARE',
          responsePath: null,
          passed: !evalRes.error && evalRes.success,
          score: evalRes.score || 0,
          reason: evalRes.error || 'Comparison completed',
          expectedValue: null,
          actualValue: outStr,
        });
      }
    }

    return {
      output,
      rawResponse: targetResult?.rawResponse ?? targetResultObj?.response?.raw ?? output,
      latencyMs: targetResult?.latencyMs ?? targetResultObj?.latencyMs ?? 0,
      assertions,
    };
  }

  private throwIfTargetFailed(result: EvaluateResult | null, targetResult: TargetCallResult | null): void {
    const error = result?.response?.error ?? result?.error;
    if (!targetResult && error) {
      throw new Error(error);
    }
  }

  private configureGraderEnv(aiConfig: EvalRunRequest['aiConfig']): void {
    if (!aiConfig) {
      return;
    }
    const provider = aiConfig.provider.toUpperCase();
    const apiKey = aiConfig.apiKey?.trim();
    const baseUrl = aiConfig.baseUrl?.trim()
      ? this.normalizeBaseUrl(aiConfig.baseUrl)
      : null;

    switch (provider) {
      case 'AZURE':
      case 'AZURE_OPENAI':
        if (apiKey) {
          process.env.AZURE_OPENAI_API_KEY = apiKey;
          process.env.AZURE_API_KEY = apiKey;
        }
        if (baseUrl) {
          process.env.AZURE_OPENAI_API_BASE_URL = baseUrl;
          process.env.AZURE_API_BASE_URL = baseUrl;
        }
        break;
      case 'GEMINI':
        if (apiKey) {
          process.env.GOOGLE_API_KEY = apiKey;
          process.env.GEMINI_API_KEY = apiKey;
        }
        break;
      case 'ANTHROPIC':
        if (apiKey) {
          process.env.ANTHROPIC_API_KEY = apiKey;
        }
        break;
      case 'CUSTOM':
      case 'OPENAI':
      default:
        if (apiKey) {
          process.env.OPENAI_API_KEY = apiKey;
        }
        if (baseUrl) {
          process.env.OPENAI_BASE_URL = baseUrl;
        }
        break;
    }
  }

  private normalizeBaseUrl(baseUrl: string): string {
    let normalized = baseUrl.trim();
    if (normalized.endsWith('/chat/completions')) {
      normalized = normalized.slice(0, -'/chat/completions'.length);
    }
    return normalized.endsWith('/') ? normalized.slice(0, -1) : normalized;
  }
}
