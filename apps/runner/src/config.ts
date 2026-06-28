import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  BACKEND_BASE_URL: z.string().url().default('http://localhost:8080/api/v1'),
  RUNNER_INTERNAL_TOKEN: z.string().min(1).default('dev-internal-token'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  RUNNER_REDIS_STREAM: z.string().default('eval.run.requested'),
  RUNNER_REDIS_GROUP: z.string().default('vfqc-runner'),
  RUNNER_CONSUMER_NAME: z.string().default(`runner-${process.pid}`),
  RUNNER_BLOCK_MS: z.coerce.number().int().positive().default(5000),
  RUNNER_CONCURRENCY: z.coerce.number().int().positive().default(1),
});

export type RunnerConfig = z.infer<typeof envSchema>;

export function loadConfig(): RunnerConfig {
  return envSchema.parse(process.env);
}
