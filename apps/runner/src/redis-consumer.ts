import { Redis } from 'ioredis';
import type { RunnerConfig } from './config.js';
import { logger } from './logger.js';
import { parseWithSchema, redisRunJobFieldsSchema } from './schemas.js';

export interface RunJobMessage {
  recordId: string;
  runId: string;
}

type RedisStreamEntry = [string, string[]];
type RedisStreamResponse = [string, RedisStreamEntry[]][];

export class RedisRunConsumer {
  private readonly redis: Redis;

  public constructor(private readonly config: RunnerConfig) {
    this.redis = new Redis({
      host: config.REDIS_HOST,
      port: config.REDIS_PORT,
      password: config.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
    });
  }

  public async ensureGroup(): Promise<void> {
    try {
      await this.redis.xgroup(
        'CREATE',
        this.config.RUNNER_REDIS_STREAM,
        this.config.RUNNER_REDIS_GROUP,
        '0',
        'MKSTREAM',
      );
      logger.info({ stream: this.config.RUNNER_REDIS_STREAM }, 'Created Redis consumer group');
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('BUSYGROUP')) {
        return;
      }
      throw error;
    }
  }

  public async readNext(): Promise<RunJobMessage | null> {
    const response = (await this.redis.call(
      'XREADGROUP',
      'GROUP',
      this.config.RUNNER_REDIS_GROUP,
      this.config.RUNNER_CONSUMER_NAME,
      'BLOCK',
      this.config.RUNNER_BLOCK_MS,
      'COUNT',
      1,
      'STREAMS',
      this.config.RUNNER_REDIS_STREAM,
      '>',
    )) as RedisStreamResponse | null;

    const entry = response?.[0]?.[1]?.[0];
    if (!entry) {
      return null;
    }

    const fields = this.toObject(entry[1]);
    const parsed = redisRunJobFieldsSchema.safeParse(fields);
    if (!parsed.success) {
      await this.ack(entry[0]);
      throw new Error(`Redis job ${entry[0]} validation failed: ${parsed.error.message}`);
    }
    const job = parseWithSchema(redisRunJobFieldsSchema, fields, `Redis job ${entry[0]}`);
    return { recordId: entry[0], runId: job.runId };
  }

  public async ack(recordId: string): Promise<void> {
    await this.redis.xack(this.config.RUNNER_REDIS_STREAM, this.config.RUNNER_REDIS_GROUP, recordId);
  }

  public async disconnect(): Promise<void> {
    this.redis.disconnect();
  }

  private toObject(fields: string[]): Record<string, string> {
    const result: Record<string, string> = {};
    for (let index = 0; index < fields.length; index += 2) {
      result[fields[index] ?? ''] = fields[index + 1] ?? '';
    }
    return result;
  }
}
