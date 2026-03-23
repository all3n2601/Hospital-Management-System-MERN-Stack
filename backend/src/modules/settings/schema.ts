import { z } from 'zod';

export const updateSettingsSchema = z.object({
  hospitalName: z.string().min(1).optional(),
  address: z.string().optional(),
  logoUrl: z.string().url().optional(),
  defaultTaxRate: z.number().min(0).max(100).optional(),
  workingHours: z
    .object({
      start: z.string(),
      end: z.string(),
    })
    .optional(),
  timezone: z.string().optional(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
