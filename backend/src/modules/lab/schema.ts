import { z } from 'zod';

export const CreateLabOrderSchema = z.object({
  patientId: z.string().min(1),
  doctorId: z.string().min(1),
  appointmentId: z.string().optional(),
  tests: z.array(z.object({ name: z.string().min(1), code: z.string().min(1) })).min(1),
  priority: z.enum(['routine', 'urgent', 'stat']).optional(),
  notes: z.string().optional(),
});

export const UpdateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
});

export const CreateLabResultSchema = z.object({
  labOrderId: z.string().min(1),
  results: z.array(z.object({
    testCode: z.string().min(1),
    testName: z.string().min(1),
    value: z.string().min(1),
    unit: z.string().optional(),
    referenceRange: z.string().optional(),
    isNormal: z.boolean().optional(),
  })).min(1),
  collectedAt: z.string().optional(),
  resultedAt: z.string().optional(),
  notes: z.string().optional(),
  reportUrl: z.string().optional(),
});

export const VerifyResultSchema = z.object({
  verifiedBy: z.string().min(1), // doctorId
  notes: z.string().optional(),
});

export const ListLabOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  patientId: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
});
