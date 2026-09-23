import { createClient, RedisClientType } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let redisClient: RedisClientType | null = null;
let isConnected = false;

export const getRedisClient = async (): Promise<RedisClientType | null> => {
  if (redisClient && isConnected) {
    return redisClient;
  }

  try {
    redisClient = createClient({
      url: REDIS_URL,
      socket: {
        connectTimeout: 3000,
        reconnectStrategy: (retries: number) => {
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
  } catch (error) {
    console.warn('[Redis] Connection skipped or failed (running in degraded cache mode):', (error as Error).message);
    redisClient = null;
    isConnected = false;
    return null;
  }
};

export const getCachedData = async <T>(key: string): Promise<T | null> => {
  try {
    const client = await getRedisClient();
    if (!client || !isConnected) return null;
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.warn(`[Redis] Error getting key "${key}":`, (err as Error).message);
    return null;
  }
};

export const setCachedData = async (key: string, value: unknown, ttlSeconds = 60): Promise<void> => {
  try {
    const client = await getRedisClient();
    if (!client || !isConnected) return;
    await client.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    console.warn(`[Redis] Error setting key "${key}":`, (err as Error).message);
  }
};
