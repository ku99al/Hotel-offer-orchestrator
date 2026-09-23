"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setCachedData = exports.getCachedData = exports.getRedisClient = void 0;
const redis_1 = require("redis");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
let redisClient = null;
let isConnected = false;
const getRedisClient = async () => {
    if (redisClient && isConnected) {
        return redisClient;
    }
    try {
        redisClient = (0, redis_1.createClient)({
            url: REDIS_URL,
            socket: {
                connectTimeout: 3000,
                reconnectStrategy: (retries) => {
                    if (retries > 3) {
                        return new Error('Redis connection retry limit reached');
                    }
                    return Math.min(retries * 500, 2000);
                },
            },
        });
        redisClient.on('error', (err) => {
            console.warn('[Redis] Client error:', err.message);
            isConnected = false;
        });
        redisClient.on('connect', () => {
            console.log('[Redis] Connected successfully');
            isConnected = true;
        });
        await redisClient.connect();
        return redisClient;
    }
    catch (error) {
        console.warn('[Redis] Connection skipped or failed (running in degraded cache mode):', error.message);
        redisClient = null;
        isConnected = false;
        return null;
    }
};
exports.getRedisClient = getRedisClient;
const getCachedData = async (key) => {
    try {
        const client = await (0, exports.getRedisClient)();
        if (!client || !isConnected)
            return null;
        const data = await client.get(key);
        return data ? JSON.parse(data) : null;
    }
    catch (err) {
        console.warn(`[Redis] Error getting key "${key}":`, err.message);
        return null;
    }
};
exports.getCachedData = getCachedData;
const setCachedData = async (key, value, ttlSeconds = 60) => {
    try {
        const client = await (0, exports.getRedisClient)();
        if (!client || !isConnected)
            return;
        await client.setEx(key, ttlSeconds, JSON.stringify(value));
    }
    catch (err) {
        console.warn(`[Redis] Error setting key "${key}":`, err.message);
    }
};
exports.setCachedData = setCachedData;
