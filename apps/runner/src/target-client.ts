import type { EvalRunRequest, TargetConfigPayload } from './types.js';
import { parseJsonObject, readPath, stringifyJson } from './json.js';
import { renderTemplate } from './template.js';

export interface TargetCallResult {
  output: unknown;
  rawResponse: unknown;
  latencyMs: number;
}

export class TargetClient {
  public async callTarget(
    target: TargetConfigPayload,
    rowData: Record<string, unknown>,
  ): Promise<TargetCallResult> {
    const startedAt = Date.now();
    const url = this.buildUrl(target, rowData);
    const response = await fetch(url, {
      method: target.method,
      headers: this.buildHeaders(target, rowData),
      body: this.buildBody(target, rowData),
      signal: AbortSignal.timeout(target.timeoutMs ?? 30_000),
    });
    const rawText = await response.text();
    const rawResponse = this.parseResponse(rawText);

    if (!response.ok) {
      throw new Error(`Target API failed ${response.status} ${response.statusText}: ${rawText}`);
    }

    return {
      output: target.responsePath ? readPath(rawResponse, target.responsePath) : rawResponse,
      rawResponse,
      latencyMs: Date.now() - startedAt,
    };
  }

  private buildUrl(target: TargetConfigPayload, rowData: Record<string, unknown>): URL {
    const url = new URL(renderTemplate(target.url, rowData) ?? target.url);
    const query = this.replaceSecrets(parseJsonObject(target.queryParams), target.secrets);
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, renderTemplate(String(value), rowData) ?? '');
    }
    return url;
  }

  private buildHeaders(target: TargetConfigPayload, rowData: Record<string, unknown>): Headers {
    const headers = new Headers();
    const rawHeaders = this.replaceSecrets(parseJsonObject(target.headers), target.secrets);
    for (const [key, value] of Object.entries(rawHeaders)) {
      headers.set(key, renderTemplate(String(value), rowData) ?? '');
    }
    return headers;
  }

  private buildBody(target: TargetConfigPayload, rowData: Record<string, unknown>): string | undefined {
    if (target.method.toUpperCase() === 'GET' || target.method.toUpperCase() === 'HEAD') {
      return undefined;
    }
    const rendered = renderTemplate(target.bodyTemplate, rowData);
    return rendered ?? stringifyJson(rowData);
  }

  private replaceSecrets(
    input: Record<string, unknown>,
    secrets: EvalRunRequest['targetConfig']['secrets'],
  ): Record<string, unknown> {
    return Object.fromEntries(
      Object.entries(input).map(([key, value]) => [
        key,
        value === 'SECRET_REDACTED' && secrets[key] ? secrets[key] : value,
      ]),
    );
  }

  private parseResponse(rawText: string): unknown {
    if (!rawText.trim()) {
      return {};
    }
    try {
      return JSON.parse(rawText) as unknown;
    } catch {
      return rawText;
    }
  }
}
