import Redis from 'ioredis';
import { logger } from '../middleware/requestLogger';

let redisClient: Redis;

export function getRedisClient(): Redis {
  if (!redisClient) {
    throw new Error('Redis not initialized — call connectRedis() first');
  }
  return redisClient;
}

export async function connectRedis(url?: string): Promise<Redis> {
  const redisUrl = url || process.env.REDIS_URL || 'redis://localhost:6379';

  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    enableReadyCheck: true,
  });

  await redisClient.connect();
  logger.info('Redis connected');

  redisClient.on('error', (err) => logger.error('Redis error:', err));
  redisClient.on('reconnecting', () => logger.warn('Redis reconnecting...'));

  return redisClient;
}
