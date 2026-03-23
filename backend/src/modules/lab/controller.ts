import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AuthError, ValidationError } from '../../middleware/errorHandler';
import { successResponse } from '../../types/api';
import {
  CreateLabOrderSchema,
  UpdateOrderStatusSchema,
  CreateLabResultSchema,
  VerifyResultSchema,
  ListLabOrdersQuerySchema,
} from './schema';
import * as LabService from './service';

function parseZodError(err: ZodError): ValidationError {
  const details: Record<string, unknown> = {};
  for (const issue of err.errors) {
    details[issue.path.join('.')] = issue.message;
  }
  return new ValidationError('Validation failed', details);
}

export async function createLabOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(new AuthError());
    const parsed = CreateLabOrderSchema.safeParse(req.body);
    if (!parsed.success) return next(parseZodError(parsed.error));
    const order = await LabService.createLabOrder(parsed.data, req.user._id);
    res.status(201).json(successResponse(order));
  } catch (err) {
    next(err);
  }
}

export async function listLabOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(new AuthError());
    const parsed = ListLabOrdersQuerySchema.safeParse(req.query);
    if (!parsed.success) return next(parseZodError(parsed.error));
    const result = await LabService.listLabOrders(parsed.data, req.user._id, req.ownOnly);
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

export async function getLabOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(new AuthError());
    const order = await LabService.getLabOrderById(req.params.id, req.user._id, req.ownOnly);
    res.json(successResponse(order));
  } catch (err) {
    next(err);
  }
}

export async function updateLabOrderStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(new AuthError());
    const parsed = UpdateOrderStatusSchema.safeParse(req.body);
    if (!parsed.success) return next(parseZodError(parsed.error));
    const order = await LabService.updateLabOrderStatus(req.params.id, parsed.data);
    res.json(successResponse(order));
  } catch (err) {
    next(err);
  }
}

export async function createLabResult(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(new AuthError());
    const parsed = CreateLabResultSchema.safeParse(req.body);
    if (!parsed.success) return next(parseZodError(parsed.error));
    const result = await LabService.createLabResult(parsed.data, req.user._id);
    res.status(201).json(successResponse(result));
  } catch (err) {
    next(err);
  }
}

export async function getLabResultByOrderId(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(new AuthError());
    const result = await LabService.getLabResultByOrderId(req.params.orderId, req.user._id, req.ownOnly);
    res.json(successResponse(result));
  } catch (err) {
    next(err);
  }
}

export async function verifyLabResult(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(new AuthError());
    const parsed = VerifyResultSchema.safeParse(req.body);
    if (!parsed.success) return next(parseZodError(parsed.error));
    const result = await LabService.verifyLabResult(req.params.id, parsed.data, req.user._id);
    res.json(successResponse(result));
  } catch (err) {
    next(err);
  }
}
