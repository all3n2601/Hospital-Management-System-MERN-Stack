import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AuthError, ValidationError } from '../../middleware/errorHandler';
import { successResponse } from '../../types/api';
import {
  CreateDrugSchema,
  UpdateDrugSchema,
  CreatePrescriptionSchema,
  ActivatePrescriptionSchema,
  DispensePrescriptionSchema,
  CancelPrescriptionSchema,
  ListDrugsQuerySchema,
  ListPrescriptionsQuerySchema,
} from './schema';
import * as PharmacyService from './service';

function parseZodError(err: ZodError): ValidationError {
  const details: Record<string, unknown> = {};
  for (const issue of err.errors) {
    details[issue.path.join('.')] = issue.message;
  }
  return new ValidationError('Validation failed', details);
}

// ---------------------------------------------------------------------------
// Drug controllers
// ---------------------------------------------------------------------------

export async function createDrug(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(new AuthError());
    const parsed = CreateDrugSchema.safeParse(req.body);
    if (!parsed.success) return next(parseZodError(parsed.error));
    const drug = await PharmacyService.createDrug(parsed.data);
    res.status(201).json(successResponse(drug));
  } catch (err) {
    next(err);
  }
}

export async function listDrugs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(new AuthError());
    const parsed = ListDrugsQuerySchema.safeParse(req.query);
    if (!parsed.success) return next(parseZodError(parsed.error));
    const result = await PharmacyService.listDrugs(parsed.data);
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

export async function getDrugById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(new AuthError());
    const drug = await PharmacyService.getDrugById(req.params.id);
    res.json(successResponse(drug));
  } catch (err) {
    next(err);
  }
}

export async function updateDrug(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(new AuthError());
    const parsed = UpdateDrugSchema.safeParse(req.body);
    if (!parsed.success) return next(parseZodError(parsed.error));
    const drug = await PharmacyService.updateDrug(req.params.id, parsed.data);
    res.json(successResponse(drug));
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Prescription controllers
// ---------------------------------------------------------------------------

export async function createPrescription(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(new AuthError());
    const parsed = CreatePrescriptionSchema.safeParse(req.body);
    if (!parsed.success) return next(parseZodError(parsed.error));
    const prescription = await PharmacyService.createPrescription(parsed.data);
    res.status(201).json(successResponse(prescription));
  } catch (err) {
    next(err);
  }
}

export async function listPrescriptions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(new AuthError());
    const parsed = ListPrescriptionsQuerySchema.safeParse(req.query);
    if (!parsed.success) return next(parseZodError(parsed.error));
    const result = await PharmacyService.listPrescriptions(
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

export async function getPrescriptionById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(new AuthError());
    const prescription = await PharmacyService.getPrescriptionById(
      req.params.id,
      req.user._id,
      req.ownOnly
    );
    res.json(successResponse(prescription));
  } catch (err) {
    next(err);
  }
}

export async function activatePrescription(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(new AuthError());
    const parsed = ActivatePrescriptionSchema.safeParse(req.body);
    if (!parsed.success) return next(parseZodError(parsed.error));
    const prescription = await PharmacyService.activatePrescription(
      req.params.id,
      parsed.data
    );
    res.json(successResponse(prescription));
  } catch (err) {
    next(err);
  }
}

export async function dispensePrescription(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(new AuthError());
    const parsed = DispensePrescriptionSchema.safeParse(req.body);
    if (!parsed.success) return next(parseZodError(parsed.error));
    const prescription = await PharmacyService.dispensePrescription(
      req.params.id,
      parsed.data,
      req.user._id
    );
    res.json(successResponse(prescription));
  } catch (err) {
    next(err);
  }
}

export async function cancelPrescription(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(new AuthError());
    const parsed = CancelPrescriptionSchema.safeParse(req.body);
    if (!parsed.success) return next(parseZodError(parsed.error));
    const prescription = await PharmacyService.cancelPrescription(
      req.params.id,
      parsed.data
    );
    res.json(successResponse(prescription));
  } catch (err) {
    next(err);
  }
}
