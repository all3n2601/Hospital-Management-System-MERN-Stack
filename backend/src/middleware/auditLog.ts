import { Request, Response, NextFunction } from 'express';
import { AuditLog } from '../models/AuditLog';
import { logger } from './requestLogger';

interface AuditOptions {
  resourceType: string;
  action: string;
  /**
   * Optional function to sanitize/redact PII or sensitive fields from the request body
   * before storing it in the audit log. If not provided, the raw body is stored as-is.
   * Example: `sanitize: (body) => { const { password, ...safe } = body as Record<string, unknown>; return safe; }`
   */
  sanitize?: (body: unknown) => Record<string, unknown>;
}

export function auditLog(options: AuditOptions) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Note: `before` state is not captured automatically.
    // Controllers that need before-state should attach it to res.locals.auditBefore
    // before calling next(). The auditLog middleware will include it if present.

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
          before: res.locals.auditBefore as Record<string, unknown> | undefined,
          after: options.sanitize ? options.sanitize(body) : body as Record<string, unknown>,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        }).catch(err => logger.error('AuditLog write failed', { error: (err as Error).message }));
      }
      return originalJson(body);
    };

    next();
  };
}
