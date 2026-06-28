import { describe, expect, it } from 'vitest';
import { AssertionEvaluator } from '../src/assertion-evaluator.js';
import type { EvalRunRequest } from '../src/types.js';

describe('AssertionEvaluator', () => {
  it('maps expected column public id to dataset column name', () => {
    const request: EvalRunRequest = {
      runId: 'run-1',
      internalRunId: 1,
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

    const results = new AssertionEvaluator().evaluate(
      request,
      { expected_status: 'OK' },
      { status: 'OK' },
    );

    expect(results).toHaveLength(1);
    expect(results[0]?.passed).toBe(true);
    expect(results[0]?.expectedValue).toBe('OK');
    expect(results[0]?.actualValue).toBe('OK');
  });
});
