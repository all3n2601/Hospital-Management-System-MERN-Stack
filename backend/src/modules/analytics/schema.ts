import { z } from 'zod';

export const appointmentQuerySchema = z.object({
  period: z.enum(['day', 'week', 'month']).default('month'),
  doctorId: z.string().optional(),
});

export type AppointmentQueryInput = z.infer<typeof appointmentQuerySchema>;
