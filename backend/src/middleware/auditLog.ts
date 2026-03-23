import { Request, Response, NextFunction } from 'express';
import { AuditLog } from '../models/AuditLog';
import { logger } from './requestLogger';

interface AuditOptions {
  resourceType: string;
  action: string;
}

export function auditLog(options: AuditOptions) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Capture original json method to intercept response body
    const originalJson = res.json.bind(res);

    res.json = function(body: unknown) {
      // Only audit successful mutations
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        AuditLog.create({
          actorId: req.user._id,
          actorRole: req.user.role,
          action: options.action,
          resourceType: options.resourceType,
          resourceId: (req.params.id ?? (body as Record<string, unknown>)?._id ?? 'unknown') as string,
          after: body,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        }).catch(err => logger.error('AuditLog write failed', { error: (err as Error).message }));
      }
      return originalJson(body);
    };

    next();
  };
}
