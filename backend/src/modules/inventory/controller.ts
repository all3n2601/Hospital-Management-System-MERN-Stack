import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AuthError, ValidationError } from '../../middleware/errorHandler';
import { successResponse } from '../../types/api';
import {
  CreateInventoryItemSchema,
  UpdateInventoryItemSchema,
  AdjustStockSchema,
  ListInventoryQuerySchema,
  ListMovementsQuerySchema,
} from './schema';
import * as InventoryService from './service';

function parseZodError(err: ZodError): ValidationError {
  const details: Record<string, unknown> = {};
  for (const issue of err.errors) {
    details[issue.path.join('.')] = issue.message;
  }
  return new ValidationError('Validation failed', details);
}

export async function createItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(new AuthError());
    const parsed = CreateInventoryItemSchema.safeParse(req.body);
    if (!parsed.success) return next(parseZodError(parsed.error));
    const item = await InventoryService.createItem(parsed.data);
    res.status(201).json(successResponse(item));
  } catch (err) {
    next(err);
  }
}

export async function listItems(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(new AuthError());
    const parsed = ListInventoryQuerySchema.safeParse(req.query);
    if (!parsed.success) return next(parseZodError(parsed.error));
    const result = await InventoryService.listItems(parsed.data);
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

export async function getItemById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(new AuthError());
    const item = await InventoryService.getItemById(req.params.id);
    res.json(successResponse(item));
  } catch (err) {
    next(err);
  }
}

export async function updateItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(new AuthError());
    const parsed = UpdateInventoryItemSchema.safeParse(req.body);
    if (!parsed.success) return next(parseZodError(parsed.error));
    const item = await InventoryService.updateItem(req.params.id, parsed.data);
    res.json(successResponse(item));
  } catch (err) {
    next(err);
  }
}

export async function adjustStock(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(new AuthError());
    const parsed = AdjustStockSchema.safeParse(req.body);
    if (!parsed.success) return next(parseZodError(parsed.error));
    const result = await InventoryService.adjustStock(
      req.params.id,
      parsed.data,
      req.user._id
    );
    res.json(successResponse(result));
  } catch (err) {
    next(err);
  }
}

export async function listItemMovements(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(new AuthError());
    const parsed = ListMovementsQuerySchema.safeParse(req.query);
    if (!parsed.success) return next(parseZodError(parsed.error));
    const result = await InventoryService.listItemMovements(req.params.id, parsed.data);
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

export async function listAllMovements(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(new AuthError());
    const parsed = ListMovementsQuerySchema.safeParse(req.query);
    if (!parsed.success) return next(parseZodError(parsed.error));
    const result = await InventoryService.listAllMovements(parsed.data);
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
