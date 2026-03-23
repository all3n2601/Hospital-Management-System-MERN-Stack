import { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../db/redis';
import { logger } from './requestLogger';
import { errorResponse } from '../types/api';

const WINDOW_SECONDS = 60;
const MAX_REQUESTS = 100;

export async function rateLimiter(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const redis = getRedisClient();
    const identifier = req.ip ?? 'unknown';
    const key = `ratelimit:${identifier}`;

    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, WINDOW_SECONDS);
    }

    res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS - current));

    if (current > MAX_REQUESTS) {
      res.status(429).json(errorResponse('RATE_LIMIT_EXCEEDED', 'Too many requests — please try again later'));
      return;
    }

    next();
  } catch (err) {
    // Redis unavailable — fail open (don't block requests)
    logger.warn('Rate limiter Redis error — failing open', { error: (err as Error).message });
    next();
  }
}
