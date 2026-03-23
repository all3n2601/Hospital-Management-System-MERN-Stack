import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ValidationError, AuthError } from '../../middleware/errorHandler';
import { successResponse } from '../../types/api';
import { CreateInvoiceSchema, RecordPaymentSchema, VoidInvoiceSchema, ListInvoicesQuerySchema } from './schema';
import * as BillingService from './service';

function parseZodError(err: ZodError): ValidationError {
  const details: Record<string, unknown> = {};
  for (const issue of err.errors) {
    details[issue.path.join('.')] = issue.message;
  }
  return new ValidationError('Validation failed', details);
}

export async function createInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(new AuthError());

    const parsed = CreateInvoiceSchema.safeParse(req.body);
    if (!parsed.success) return next(parseZodError(parsed.error));

    const invoice = await BillingService.createInvoice(parsed.data, req.user._id);
    res.status(201).json(successResponse(invoice));
  } catch (err) {
    next(err);
  }
}

export async function listInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(new AuthError());

    const parsed = ListInvoicesQuerySchema.safeParse(req.query);
    if (!parsed.success) return next(parseZodError(parsed.error));

    const result = await BillingService.listInvoices(
      parsed.data,
      req.user._id,
      req.user.role,
      req.ownOnly
    );

    res.json(
      successResponse(result.data, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      })
    );
  } catch (err) {
    next(err);
  }
}

export async function getInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(new AuthError());

    const invoice = await BillingService.getInvoiceById(
      req.params.id,
      req.user._id,
      req.user.role,
      req.ownOnly
    );
    res.json(successResponse(invoice));
  } catch (err) {
    next(err);
  }
}

export async function issueInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(new AuthError());

    const invoice = await BillingService.issueInvoice(req.params.id);
    res.json(successResponse(invoice));
  } catch (err) {
    next(err);
  }
}

export async function recordPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(new AuthError());

    const parsed = RecordPaymentSchema.safeParse(req.body);
    if (!parsed.success) return next(parseZodError(parsed.error));

    const invoice = await BillingService.recordPayment(
      req.params.id,
      parsed.data,
      req.user._id
    );
    res.json(successResponse(invoice));
  } catch (err) {
    next(err);
  }
}

export async function voidInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(new AuthError());

    const parsed = VoidInvoiceSchema.safeParse(req.body);
    if (!parsed.success) return next(parseZodError(parsed.error));

    const invoice = await BillingService.voidInvoice(
      req.params.id,
      parsed.data,
      req.user._id
    );
    res.json(successResponse(invoice));
  } catch (err) {
    next(err);
  }
}
