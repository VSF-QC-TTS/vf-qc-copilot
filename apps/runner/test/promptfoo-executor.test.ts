import { describe, expect, it } from 'vitest';
import { PromptfooExecutor } from '../src/promptfoo-executor.js';
import type { EvalRunRequest, TargetConfigPayload } from '../src/types.js';
import type { TargetCallResult, TargetCaller } from '../src/target-client.js';

class RecordingTargetClient implements TargetCaller {
  public readonly calls: Array<{
    target: TargetConfigPayload;
    rowData: Record<string, unknown>;
  }> = [];

  public async callTarget(
    target: TargetConfigPayload,
    rowData: Record<string, unknown>,
  ): Promise<TargetCallResult> {
    this.calls.push({ target, rowData });
    return {
      output: { status: 'OK' },
      rawResponse: { data: { status: 'OK' } },
      latencyMs: 42,
    };
  }
}

describe('PromptfooExecutor', () => {
  it('runs the target through a promptfoo provider and maps field assertions', async () => {
    const targetClient = new RecordingTargetClient();
    const request = createRequest();

    const result = await new PromptfooExecutor(targetClient).executeRow(
      request,
      { question: 'Ping?', expected_status: 'OK' },
    );

    expect(targetClient.calls).toEqual([
      {
        target: request.targetConfig,
        rowData: { question: 'Ping?', expected_status: 'OK' },
      },
    ]);
    expect(result.output).toEqual({ status: 'OK' });
    expect(result.rawResponse).toEqual({ data: { status: 'OK' } });
    expect(result.latencyMs).toBe(42);
    expect(result.assertions).toEqual([
      expect.objectContaining({
        assertionName: 'EQUALS',
        assertionType: 'FIELD_ASSERTION',
        responsePath: '$.status',
        passed: true,
        score: 1,
        expectedValue: 'OK',
        actualValue: 'OK',
      }),
    ]);
  });
});

function createRequest(): EvalRunRequest {
  return {
    runId: 'run-1',
    internalRunId: 1,
    runType: 'EVALUATION',
    targetConfig: {
      method: 'POST',
      url: 'http://localhost',
      headers: null,
      queryParams: null,
      bodyTemplate: null,
      responsePath: null,
      timeoutMs: 1000,
      secrets: {},
    },
    aiConfig: null,
    datasetRows: [],
    schemaColumns: [
      {
        publicId: 'question-key',
        columnName: 'question',
        dataType: 'STRING',
        role: 'INPUT',
      },
      {
        publicId: 'expected-status-key',
        columnName: 'expected_status',
        dataType: 'STRING',
        role: 'EXPECTED',
      },
    ],
    verification: {
      mode: 'FIELD_CHECKS',
      version: 1,
      items: [
        {
          publicId: 'item-1',
          internalId: 1,
          type: 'FIELD_ASSERTION',
          targetPaths: null,
          referenceColumnKeys: null,
          rubric: null,
          fieldAssertion: {
            actualPath: '$.status',
            operator: 'EQUALS',
            expectedColumnKey: 'expected-status-key',
          },
        },
      ],
    },
  };
}
