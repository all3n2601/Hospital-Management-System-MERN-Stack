import winston from 'winston';
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    env.NODE_ENV === 'production'
      ? winston.format.json()
      : winston.format.colorize({ all: true }),
    env.NODE_ENV !== 'production'
      ? winston.format.printf(({ timestamp, level, message, ...meta }) =>
          `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`.trim()
        )
      : winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  res.on('finish', () => {
    logger.info(`${req.method} ${req.path} ${res.statusCode} ${Date.now() - start}ms`, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  });
  next();
}
