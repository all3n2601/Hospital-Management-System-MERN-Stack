import { Request, Response, NextFunction } from 'express';
import { AuthError } from '../../middleware/errorHandler';
import { successResponse } from '../../types/api';
import {
  CreateLabOrderSchema,
  UpdateOrderStatusSchema,
  CreateLabResultSchema,
  VerifyResultSchema,
  ListLabOrdersQuerySchema,
} from './schema';
import * as LabService from './service';

export async function createLabOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(new AuthError());
    const input = CreateLabOrderSchema.parse(req.body);
    const order = await LabService.createLabOrder(input, req.user._id);
    res.status(201).json(successResponse(order));
  } catch (err) {
    next(err);
  }
}

export async function listLabOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(new AuthError());
    const query = ListLabOrdersQuerySchema.parse(req.query);
    const result = await LabService.listLabOrders(query, req.user._id, req.ownOnly);
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
    const input = UpdateOrderStatusSchema.parse(req.body);
    const order = await LabService.updateLabOrderStatus(req.params.id, input);
    res.json(successResponse(order));
  } catch (err) {
    next(err);
  }
}

export async function createLabResult(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(new AuthError());
    const input = CreateLabResultSchema.parse(req.body);
    const result = await LabService.createLabResult(input, req.user._id);
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
    const input = VerifyResultSchema.parse(req.body);
    const result = await LabService.verifyLabResult(req.params.id, input, req.user._id);
    res.json(successResponse(result));
  } catch (err) {
    next(err);
  }
}
