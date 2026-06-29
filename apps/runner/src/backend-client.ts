import type {
  EvalRunRequest,
  RunnerCaseResult,
} from './types.js';
import { cancelStatusSchema, evalRunRequestSchema, parseWithSchema } from './schemas.js';

export class BackendClient {
  public constructor(
    private readonly baseUrl: string,
    private readonly internalToken: string,
  ) {}

  public async getEvalRequest(runId: string): Promise<EvalRunRequest> {
    const response = await this.request<unknown>(`/internal/runs/${runId}/eval-request`, { method: 'GET' });
    return parseWithSchema(evalRunRequestSchema, response, 'EvalRunRequest') as EvalRunRequest;
  }

  public async reportStarted(runId: string): Promise<void> {
    await this.request<void>(`/internal/runs/${runId}/started`, { method: 'POST' });
  }

  public async reportCaseStarted(runId: string, datasetRowPublicId: string, caseIndex: number): Promise<void> {
    await this.request<void>(`/internal/runs/${runId}/case-started`, {
      method: 'POST',
      body: JSON.stringify({ datasetRowPublicId, caseIndex }),
    });
  }

  public async reportCaseResult(runId: string, result: RunnerCaseResult): Promise<void> {
    await this.request<void>(`/internal/runs/${runId}/case-results`, {
      method: 'POST',
      body: JSON.stringify(result),
    });
  }

  public async reportComplete(runId: string): Promise<void> {
    await this.request<void>(`/internal/runs/${runId}/complete`, { method: 'POST' });
  }

  public async reportFail(runId: string, message: string): Promise<void> {
    await this.request<void>(`/internal/runs/${runId}/fail`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  public async reportCancelled(runId: string): Promise<void> {
    await this.request<void>(`/internal/runs/${runId}/cancelled`, { method: 'POST' });
  }

  public async isCancellationRequested(runId: string): Promise<boolean> {
    const response = await this.request<unknown>(
      `/internal/runs/${runId}/cancel-status`,
      { method: 'GET' },
    );
    return parseWithSchema(cancelStatusSchema, response, 'CancelStatusResponse').cancellationRequested;
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'X-VFQC-Internal-Token': this.internalToken,
        ...(init.headers ?? {}),
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Backend request failed ${response.status} ${response.statusText}: ${body}`);
    }

    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return undefined as T;
    }

    const text = await response.text();
    return text ? (JSON.parse(text) as T) : (undefined as T);
  }
}
