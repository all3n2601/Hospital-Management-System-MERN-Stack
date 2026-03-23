import { z } from 'zod';

export const appointmentQuerySchema = z.object({
  period: z.enum(['day', 'week', 'month']).default('month'),
  doctorId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format').optional(),
});

export type AppointmentQueryInput = z.infer<typeof appointmentQuerySchema>;
