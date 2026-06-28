import { BackendClient } from './backend-client.js';
import { loadConfig } from './config.js';
import { logger } from './logger.js';
import { RedisRunConsumer } from './redis-consumer.js';
import { RunExecutor } from './run-executor.js';
import { RunnerWorker } from './worker.js';

const config = loadConfig();
const backendClient = new BackendClient(config.BACKEND_BASE_URL, config.RUNNER_INTERNAL_TOKEN);
const consumer = new RedisRunConsumer(config);
const executor = new RunExecutor(backendClient);
const worker = new RunnerWorker(consumer, backendClient, executor);

process.on('SIGINT', () => worker.stop());
process.on('SIGTERM', () => worker.stop());

try {
  logger.info({ stream: config.RUNNER_REDIS_STREAM }, 'Starting VFQC runner');
  await worker.start();
} finally {
  await consumer.disconnect();
}
