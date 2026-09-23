import { NativeConnection, Worker } from '@temporalio/worker';
import * as activities from './activities';
import dotenv from 'dotenv';

dotenv.config();

const TASK_QUEUE = process.env.TEMPORAL_TASK_QUEUE || 'hotel-orchestrator-queue';
const TEMPORAL_ADDRESS = process.env.TEMPORAL_ADDRESS || 'localhost:7233';

async function connectWithRetry(maxRetries = 10, retryIntervalMs = 2000): Promise<NativeConnection> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Temporal Worker] Connecting to Temporal at ${TEMPORAL_ADDRESS} (attempt ${attempt}/${maxRetries})...`);
      const connection = await NativeConnection.connect({
        address: TEMPORAL_ADDRESS,
      });
      console.log('[Temporal Worker] Connected successfully to Temporal server');
      return connection;
    } catch (error) {
      lastError = error;
      console.warn(
        `[Temporal Worker] Connection attempt ${attempt}/${maxRetries} failed: ${(error as Error).message}`
      );
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, retryIntervalMs));
      }
    }
  }

  throw lastError;
}

async function runWorker() {
  const connection = await connectWithRetry();

  const worker = await Worker.create({
    connection,
    workflowsPath: require.resolve('./workflows'),
    activities,
    taskQueue: TASK_QUEUE,
  });

  console.log(`[Temporal Worker] Worker listening on task queue: "${TASK_QUEUE}"`);
  await worker.run();
}

runWorker().catch((err) => {
  console.error('[Temporal Worker] Failed to run worker:', err);
  process.exit(1);
});
