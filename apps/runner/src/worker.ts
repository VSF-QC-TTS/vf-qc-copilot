import type { BackendClient } from './backend-client.js';
import type { RedisRunConsumer, RunJobMessage } from './redis-consumer.js';
import type { RunExecutor } from './run-executor.js';
import { logger } from './logger.js';

export class RunnerWorker {
  private stopped = false;

  public constructor(
    private readonly consumer: RedisRunConsumer,
    private readonly backendClient: BackendClient,
    private readonly executor: RunExecutor,
  ) {}

  public stop(): void {
    this.stopped = true;
  }

  public async start(): Promise<void> {
    await this.consumer.ensureGroup();
    while (!this.stopped) {
      const job = await this.consumer.readNext();
      if (!job) {
        continue;
      }
      await this.handleJob(job);
    }
  }

  private async handleJob(job: RunJobMessage): Promise<void> {
    logger.info({ runId: job.runId, recordId: job.recordId }, 'Processing run job');
    try {
      const request = await this.backendClient.getEvalRequest(job.runId);
      await this.executor.execute(request);
      await this.consumer.ack(job.recordId);
      logger.info({ runId: job.runId }, 'Run job acknowledged');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown runner failure';
      logger.error({ runId: job.runId, error: message }, 'Run job failed');
      await this.backendClient.reportFail(job.runId, message);
      await this.consumer.ack(job.recordId);
    }
  }
}
