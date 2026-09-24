"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTemporalClient = getTemporalClient;
exports.runDedupeWorkflow = runDedupeWorkflow;
const client_1 = require("@temporalio/client");
const dotenv_1 = __importDefault(require("dotenv"));
const workflows_1 = require("./workflows");
dotenv_1.default.config();
const TEMPORAL_ADDRESS = process.env.TEMPORAL_ADDRESS || 'localhost:7233';
const TASK_QUEUE = process.env.TEMPORAL_TASK_QUEUE || 'hotel-orchestrator-queue';
let client = null;
/**
 * Retrieve a connected Temporal client with retry/wait logic.
 * Retries connecting every 2 seconds, up to 10 attempts.
 */
async function getTemporalClient(maxRetries = 10, retryIntervalMs = 2000) {
    if (client) {
        return client;
    }
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[Temporal Client] Connecting to Temporal at ${TEMPORAL_ADDRESS} (attempt ${attempt}/${maxRetries})...`);
            const connection = await client_1.Connection.connect({
                address: TEMPORAL_ADDRESS,
            });
            client = new client_1.Client({
                connection,
            });
            console.log('[Temporal Client] Connected successfully');
            return client;
        }
        catch (error) {
            lastError = error;
            console.warn(`[Temporal Client] Connection attempt ${attempt}/${maxRetries} failed: ${error.message}`);
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
async function runDedupeWorkflow(city) {
    const temporalClient = await getTemporalClient();
    const workflowId = `dedupe-hotels-${city.toLowerCase()}-${Date.now()}`;
    console.log(`[Temporal Client] Starting dedupeHotelsWorkflow (${workflowId}) on task queue "${TASK_QUEUE}" for city "${city}"`);
    const handle = await temporalClient.workflow.start(workflows_1.dedupeHotelsWorkflow, {
        taskQueue: TASK_QUEUE,
        workflowId,
        args: [city],
    });
    console.log(`[Temporal Client] Waiting for workflow ${workflowId} result...`);
    const result = await handle.result();
    console.log(`[Temporal Client] Workflow ${workflowId} finished successfully`);
    return result;
}
