import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ValidationError } from '../../middleware/errorHandler';
import { successResponse } from '../../types/api';
import {
  CreateStaffSchema,
  UpdateStaffSchema,
  CreateDepartmentSchema,
  UpdateDepartmentSchema,
} from './schema';
import * as StaffService from './service';

function parseZodError(err: ZodError): ValidationError {
  const details: Record<string, unknown> = {};
  for (const issue of err.errors) {
    details[issue.path.join('.')] = issue.message;
  }
  return new ValidationError('Validation failed', details);
}

// ─── Staff ─────────────────────────────────────────────────────────────────

export async function listStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { role, department, isActive, page, limit } = req.query as Record<string, string>;
    const result = await StaffService.listStaff({
      role,
      department,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
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

export async function createStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = CreateStaffSchema.safeParse(req.body);
    if (!parsed.success) return next(parseZodError(parsed.error));

    const result = await StaffService.createStaffMember(parsed.data);
    res.status(201).json(successResponse(result));
  } catch (err) {
    next(err);
  }
}

export async function getStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const profile = await StaffService.getStaffMember(id);
    res.json(successResponse(profile));
  } catch (err) {
    next(err);
  }
}

export async function updateStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const parsed = UpdateStaffSchema.safeParse(req.body);
    if (!parsed.success) return next(parseZodError(parsed.error));

    const result = await StaffService.updateStaffMember(id, parsed.data);
    res.json(successResponse(result));
  } catch (err) {
    next(err);
  }
}

export async function deactivateStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    await StaffService.deactivateStaff(id);
    res.json(successResponse({ message: 'Staff member deactivated' }));
  } catch (err) {
    next(err);
  }
}

// ─── Doctors ───────────────────────────────────────────────────────────────

export async function listDoctors(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await StaffService.listStaff({ role: 'doctor' });
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

export async function getAvailableDoctors(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { date, specialization } = req.query as { date?: string; specialization?: string };
    if (!date) return next(new ValidationError('date query parameter is required'));

    const doctors = await StaffService.getAvailableDoctors(date, specialization);
    res.json(successResponse(doctors));
  } catch (err) {
    next(err);
  }
}

export async function getDoctorProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const profile = await StaffService.getStaffMember(id);
    res.json(successResponse(profile));
  } catch (err) {
    next(err);
  }
}

// ─── Departments ────────────────────────────────────────────────────────────

export async function listDepartments(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const departments = await StaffService.listDepartments();
    res.json(successResponse(departments));
  } catch (err) {
    next(err);
  }
}

export async function createDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = CreateDepartmentSchema.safeParse(req.body);
    if (!parsed.success) return next(parseZodError(parsed.error));

    const department = await StaffService.createDepartment(parsed.data);
    res.status(201).json(successResponse(department));
  } catch (err) {
    next(err);
  }
}

export async function updateDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const parsed = UpdateDepartmentSchema.safeParse(req.body);
    if (!parsed.success) return next(parseZodError(parsed.error));

    const department = await StaffService.updateDepartment(id, parsed.data);
    res.json(successResponse(department));
  } catch (err) {
    next(err);
  }
}
