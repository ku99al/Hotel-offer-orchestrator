import { Connection, Client } from '@temporalio/client';
import dotenv from 'dotenv';
import { dedupeHotelsWorkflow } from './workflows';
import { AggregatedHotel } from '../types/hotel.types';

dotenv.config();

const TEMPORAL_ADDRESS = process.env.TEMPORAL_ADDRESS || 'localhost:7233';
const TASK_QUEUE = process.env.TEMPORAL_TASK_QUEUE || 'hotel-orchestrator-queue';

let client: Client | null = null;

/**
 * Retrieve a connected Temporal client with retry/wait logic.
 * Retries connecting every 2 seconds, up to 10 attempts.
 */
export async function getTemporalClient(maxRetries = 10, retryIntervalMs = 2000): Promise<Client> {
  if (client) {
    return client;
  }

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Temporal Client] Connecting to Temporal at ${TEMPORAL_ADDRESS} (attempt ${attempt}/${maxRetries})...`);
      const connection = await Connection.connect({
        address: TEMPORAL_ADDRESS,
      });

      client = new Client({
        connection,
      });

      console.log('[Temporal Client] Connected successfully');
      return client;
    } catch (error) {
      lastError = error;
      console.warn(
        `[Temporal Client] Connection attempt ${attempt}/${maxRetries} failed: ${(error as Error).message}`
      );
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, retryIntervalMs));
      }
    }
  }

  throw lastError;
}

/**
 * Execute the dedupeHotelsWorkflow on Temporal server and return the aggregated hotels.
 * This is the ONLY entrypoint for orchestrating hotel deduplication.
 */
export async function runDedupeWorkflow(city: string): Promise<AggregatedHotel[]> {
  const temporalClient = await getTemporalClient();
  const workflowId = `dedupe-hotels-${city.toLowerCase()}-${Date.now()}`;

  console.log(`[Temporal Client] Starting dedupeHotelsWorkflow (${workflowId}) on task queue "${TASK_QUEUE}" for city "${city}"`);

  const handle = await temporalClient.workflow.start(dedupeHotelsWorkflow, {
    taskQueue: TASK_QUEUE,
    workflowId,
    args: [city],
  });

  console.log(`[Temporal Client] Waiting for workflow ${workflowId} result...`);
  const result = await handle.result();
  console.log(`[Temporal Client] Workflow ${workflowId} finished successfully`);

  return result;
}
