import { describe, expect, it } from 'vitest';
import { AssertionEvaluator } from '../src/assertion-evaluator.js';
import { VerificationMapper } from '../src/verification-mapper.js';
import type { EvalRunRequest } from '../src/types.js';

describe('AssertionEvaluator', () => {
  it('maps expected column public id to dataset column name', async () => {
    const request: EvalRunRequest = {
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

    const results = await new AssertionEvaluator().evaluate(
      request,
      { expected_status: 'OK' },
      { status: 'OK' },
    );

    expect(results).toHaveLength(1);
    expect(results[0]?.passed).toBe(true);
    expect(results[0]?.expectedValue).toBe('OK');
    expect(results[0]?.actualValue).toBe('OK');
  });

  it('maps backend AI providers to promptfoo judge providers', () => {
    const mapper = new VerificationMapper();

    expect(llmProviderFor(mapper, 'GEMINI')).toBe('google:gemini-2.5-flash');
    expect(llmProviderFor(mapper, 'ANTHROPIC')).toBe('anthropic:messages:claude-3-5-sonnet');
    expect(llmProviderFor(mapper, 'CUSTOM')).toBe('openai:chat:local-model');
  });

  it('renders UI dataset/input tokens as promptfoo vars for LLM judge rubrics', () => {
    const mapper = new VerificationMapper();
    const assertion = mapper.toPromptfooAssertions(llmRequestWithRubric(), {
      question: 'What is VF 3?',
      ground_truth: 'VF 3 is an electric mini car.',
    })[0];

    expect(assertion?.value).toContain('{{ question }}');
    expect(assertion?.value).toContain('{{ ground_truth }}');
    expect(assertion?.value).toContain('response.answer');
  });
});

function llmProviderFor(mapper: VerificationMapper, provider: string): unknown {
  const request: EvalRunRequest = {
    runId: 'run1',
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
    aiConfig: {
      provider,
      baseUrl: provider === 'CUSTOM' ? 'http://localhost:11434/v1' : null,
      evaluationModel:
        provider === 'GEMINI'
          ? 'gemini-2.5-flash'
          : provider === 'ANTHROPIC'
            ? 'claude-3-5-sonnet'
            : 'local-model',
      temperature: 0,
      maxTokens: 1024,
      timeoutMs: 30000,
      retryCount: 1,
      apiKey: 'redacted',
    },
    datasetRows: [],
    schemaColumns: [],
    verification: {
      mode: 'LLM_JUDGE',
      version: 1,
      items: [
        {
          publicId: 'item-1',
          internalId: 1,
          type: 'LLM_JUDGE',
          targetPaths: '$.answer',
          referenceColumnKeys: null,
          rubric: 'Judge the answer.',
          fieldAssertion: null,
        },
      ],
    },
  };

  return mapper.toPromptfooAssertions(request, {})[0]?.provider;
}

function llmRequestWithRubric(): EvalRunRequest {
  return {
    runId: 'run3',
    internalRunId: 3,
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
        publicId: 'truth-key',
        columnName: 'ground_truth',
        dataType: 'STRING',
        role: 'EXPECTED',
      },
    ],
    verification: {
      mode: 'LLM_JUDGE',
      version: 1,
      items: [
        {
          publicId: 'item-1',
          internalId: 1,
          type: 'LLM_JUDGE',
          targetPaths: '$.answer',
          referenceColumnKeys: '["truth-key"]',
          rubric:
            'Question: $input.question. Expected: $dataset.ground_truth. Actual: $response.answer.',
          fieldAssertion: null,
        },
      ],
    },
  };
}
