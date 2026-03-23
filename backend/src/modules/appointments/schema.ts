import { z } from 'zod';

export const CreateAppointmentSchema = z.object({
  doctorId: z.string().min(1),
  patientId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  timeSlot: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM'),
  type: z.enum(['consultation', 'follow-up', 'emergency', 'procedure']).optional(),
  reason: z.string().max(500).optional(),
});

export const UpdateStatusSchema = z.object({
  status: z.enum(['confirmed', 'inProgress', 'completed', 'cancelled', 'noShow']),
  cancelReason: z.string().optional(),
  notes: z.string().optional(),
});

export const GetSlotsSchema = z.object({
  doctorId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
