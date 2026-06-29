import type { BackendClient } from './backend-client.js';
import { parseJsonObject, stringifyJson } from './json.js';
import { PromptfooExecutor } from './promptfoo-executor.js';
import type { EvalRunRequest, RunnerCaseResult, TestCaseStatus } from './types.js';

export class RunExecutor {
  public constructor(
    private readonly backendClient: BackendClient,
    private readonly promptfooExecutor = new PromptfooExecutor(),
  ) {}

  public async execute(request: EvalRunRequest): Promise<'COMPLETED' | 'CANCELLED'> {
    await this.backendClient.reportStarted(request.runId);

    for (const row of request.datasetRows) {
      if (await this.backendClient.isCancellationRequested(request.runId)) {
        await this.backendClient.reportCancelled(request.runId);
        return 'CANCELLED';
      }

      await this.backendClient.reportCaseStarted(request.runId, row.publicId, row.rowIndex);
      const result = await this.evaluateRow(request, row.publicId, row.rowIndex, row.data);
      await this.backendClient.reportCaseResult(request.runId, result);
    }

    await this.backendClient.reportComplete(request.runId);
    return 'COMPLETED';
  }

  private async evaluateRow(
    request: EvalRunRequest,
    datasetRowPublicId: string,
    caseIndex: number,
    inputData: string,
  ): Promise<RunnerCaseResult> {
    const rowData = parseJsonObject(inputData);
    const startedAt = Date.now();
    try {
      const execution = await this.promptfooExecutor.executeRow(request, rowData);
      const assertions = execution.assertions;
      const passedAssertions = assertions.filter((assertion) => assertion.passed).length;
      const score = assertions.length === 0 ? 1 : passedAssertions / assertions.length;
      const passed = assertions.every((assertion) => assertion.passed);
      return this.caseResult(
        datasetRowPublicId,
        caseIndex,
        inputData,
        stringifyJson(execution.output),
        passed ? 'PASSED' : 'FAILED',
        passed,
        score,
        null,
        execution.latencyMs,
        stringifyJson(execution.rawResponse),
        assertions,
      );
    } catch (error: unknown) {
      return this.caseResult(
        datasetRowPublicId,
        caseIndex,
        inputData,
        '{}',
        'ERROR',
        false,
        0,
        error instanceof Error ? error.message : 'Unknown target execution error',
        Date.now() - startedAt,
        '{}',
        [],
      );
    }
  }

  private caseResult(
    datasetRowPublicId: string,
    caseIndex: number,
    inputData: string,
    actualOutput: string,
    status: TestCaseStatus,
    passed: boolean,
    score: number,
    errorMessage: string | null,
    latencyMs: number,
    rawTargetResponse: string,
    assertions: RunnerCaseResult['assertions'],
  ): RunnerCaseResult {
    return {
      datasetRowPublicId,
      caseIndex,
      inputData,
      actualOutput,
      status,
      passed,
      score,
      errorMessage,
      latencyMs,
      rawTargetResponse,
      assertions,
    };
  }
}
