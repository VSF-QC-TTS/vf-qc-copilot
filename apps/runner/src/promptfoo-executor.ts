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
    const result = (summary.results?.[0] ?? null) as EvaluateResult | null;
    const targetResult = builtSuite.getTargetResult();

    this.throwIfTargetFailed(result, targetResult);

    const output = targetResult?.output ?? result?.response?.output ?? {};
    return {
      output,
      rawResponse: targetResult?.rawResponse ?? result?.response?.raw ?? output,
      latencyMs: targetResult?.latencyMs ?? result?.latencyMs ?? 0,
      assertions: this.resultMapper.mapAssertions(result, request.verification.items, output),
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
