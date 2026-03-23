import { Request, Response, NextFunction } from 'express';
import { Settings } from '../../models/Settings';
import { updateSettingsSchema } from './schema';

export async function getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const settings = await Settings.getSingleton();
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
}

export async function updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = updateSettingsSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.errors },
      });
      return;
    }

    const settings = await Settings.getSingleton();
    Object.assign(settings, parsed.data);
    await (settings as unknown as { save: () => Promise<void> }).save();

    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
}
