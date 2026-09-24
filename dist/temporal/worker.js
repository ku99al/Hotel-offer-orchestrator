"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const worker_1 = require("@temporalio/worker");
const activities = __importStar(require("./activities"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const TASK_QUEUE = process.env.TEMPORAL_TASK_QUEUE || 'hotel-orchestrator-queue';
const TEMPORAL_ADDRESS = process.env.TEMPORAL_ADDRESS || 'localhost:7233';
async function connectWithRetry(maxRetries = 10, retryIntervalMs = 2000) {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[Temporal Worker] Connecting to Temporal at ${TEMPORAL_ADDRESS} (attempt ${attempt}/${maxRetries})...`);
            const connection = await worker_1.NativeConnection.connect({
                address: TEMPORAL_ADDRESS,
            });
            console.log('[Temporal Worker] Connected successfully to Temporal server');
            return connection;
        }
        catch (error) {
            lastError = error;
            console.warn(`[Temporal Worker] Connection attempt ${attempt}/${maxRetries} failed: ${error.message}`);
            if (attempt < maxRetries) {
                await new Promise((resolve) => setTimeout(resolve, retryIntervalMs));
            }
        }
    }
    throw lastError;
}
async function runWorker() {
    const connection = await connectWithRetry();
    const worker = await worker_1.Worker.create({
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
