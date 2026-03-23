import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AuthError, ValidationError } from '../../middleware/errorHandler';
import { successResponse } from '../../types/api';
import {
  CreateDocumentSchema,
  IssueDocumentSchema,
  VoidDocumentSchema,
  ListDocumentsQuerySchema,
} from './schema';
import * as DocumentService from './service';

function parseZodError(err: ZodError): ValidationError {
  const details: Record<string, unknown> = {};
  for (const issue of err.errors) {
    details[issue.path.join('.')] = issue.message;
  }
  return new ValidationError('Validation failed', details);
}

export async function createDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(new AuthError());
    const parsed = CreateDocumentSchema.safeParse(req.body);
    if (!parsed.success) return next(parseZodError(parsed.error));
    const isAdmin = req.user.role === 'admin';
    const doc = await DocumentService.createDocument(parsed.data, req.user._id, isAdmin);
    res.status(201).json(successResponse(doc));
  } catch (err) {
    next(err);
  }
}

export async function listDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(new AuthError());
    const parsed = ListDocumentsQuerySchema.safeParse(req.query);
    if (!parsed.success) return next(parseZodError(parsed.error));
    const result = await DocumentService.listDocuments(
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

export async function getDocumentById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(new AuthError());
    const doc = await DocumentService.getDocumentById(req.params.id, req.user._id, req.ownOnly);
    res.json(successResponse(doc));
  } catch (err) {
    next(err);
  }
}

export async function issueDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(new AuthError());
    const parsed = IssueDocumentSchema.safeParse(req.body);
    if (!parsed.success) return next(parseZodError(parsed.error));
    const isAdmin = req.user.role === 'admin';
    const doc = await DocumentService.issueDocument(req.params.id, parsed.data, req.user._id, isAdmin);
    res.json(successResponse(doc));
  } catch (err) {
    next(err);
  }
}

export async function voidDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(new AuthError());
    const parsed = VoidDocumentSchema.safeParse(req.body);
    if (!parsed.success) return next(parseZodError(parsed.error));
    const isAdmin = req.user.role === 'admin';
    const doc = await DocumentService.voidDocument(req.params.id, parsed.data, req.user._id, isAdmin);
    res.json(successResponse(doc));
  } catch (err) {
    next(err);
  }
}
