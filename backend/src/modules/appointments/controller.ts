import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ValidationError, AuthError } from '../../middleware/errorHandler';
import { successResponse } from '../../types/api';
import { CreateAppointmentSchema, UpdateStatusSchema, GetSlotsSchema } from './schema';
import * as AppointmentService from './service';

function parseZodError(err: ZodError): ValidationError {
  const details: Record<string, unknown> = {};
  for (const issue of err.errors) {
    details[issue.path.join('.')] = issue.message;
  }
  return new ValidationError('Validation failed', details);
}

export async function bookAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(new AuthError());

    const parsed = CreateAppointmentSchema.safeParse(req.body);
    if (!parsed.success) return next(parseZodError(parsed.error));

    const appointment = await AppointmentService.bookAppointment(parsed.data, req.user._id);
    res.status(201).json(successResponse(appointment));
  } catch (err) {
    next(err);
  }
}

export async function listAppointments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(new AuthError());

    const { date, doctorId, patientId, status, departmentId, page, limit } = req.query as Record<string, string>;
    const result = await AppointmentService.listAppointments({
      date,
      doctorId,
      patientId,
      status,
      departmentId,
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

export async function getAvailableSlots(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(new AuthError());

    const parsed = GetSlotsSchema.safeParse(req.query);
    if (!parsed.success) return next(parseZodError(parsed.error));

    const slots = await AppointmentService.getAvailableSlots(parsed.data.doctorId, parsed.data.date);
    res.json(successResponse(slots));
  } catch (err) {
    next(err);
  }
}

export async function getAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(new AuthError());

    const appointment = await AppointmentService.getAppointmentById(req.params.id);
    res.json(successResponse(appointment));
  } catch (err) {
    next(err);
  }
}

export async function updateAppointmentStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(new AuthError());

    const parsed = UpdateStatusSchema.safeParse(req.body);
    if (!parsed.success) return next(parseZodError(parsed.error));

    const appointment = await AppointmentService.updateAppointmentStatus(
      req.params.id,
      parsed.data,
      req.user._id,
      req.user.role
    );
    res.json(successResponse(appointment));
  } catch (err) {
    next(err);
  }
}

export async function cancelAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(new AuthError());

    const { cancelReason } = req.body as { cancelReason?: string };
    const appointment = await AppointmentService.cancelAppointment(
      req.params.id,
      req.user._id,
      req.user.role,
      cancelReason
    );
    res.json(successResponse(appointment));
  } catch (err) {
    next(err);
  }
}
