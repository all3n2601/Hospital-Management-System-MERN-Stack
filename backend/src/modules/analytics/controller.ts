import { Request, Response, NextFunction } from 'express';
import { appointmentQuerySchema } from './schema';
import * as AnalyticsService from './service';

export async function getAppointmentAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = appointmentQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid query params', details: parsed.error.errors },
      });
      return;
    }

    const { period, doctorId } = parsed.data;
    const data = await AnalyticsService.getAppointmentAnalytics(period, doctorId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getRevenueAnalytics(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await AnalyticsService.getRevenueAnalytics();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getLabAnalytics(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await AnalyticsService.getLabAnalytics();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getPrescriptionAnalytics(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await AnalyticsService.getPrescriptionAnalytics();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
