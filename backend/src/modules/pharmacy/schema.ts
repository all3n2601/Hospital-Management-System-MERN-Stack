import { z } from 'zod';

export const CreateDrugSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  category: z.string().min(1),
  unit: z.string().min(1),
  stockQuantity: z.number().int().min(0).optional(),
  reorderLevel: z.number().int().min(0),
  description: z.string().optional(),
});

export const UpdateDrugSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  unit: z.string().min(1).optional(),
  stockQuantity: z.number().int().min(0).optional(),
  reorderLevel: z.number().int().min(0).optional(),
  description: z.string().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

export const CreatePrescriptionSchema = z.object({
  patientId: z.string().min(1),
  doctorId: z.string().min(1),
  appointmentId: z.string().optional(),
  lineItems: z.array(z.object({
    drugId: z.string().min(1),
    drugName: z.string().min(1),
    dosage: z.string().min(1),
    frequency: z.string().min(1),
    duration: z.string().min(1),
    quantity: z.number().int().min(1).optional(),
  })).min(1),
  notes: z.string().optional(),
});

export const ActivatePrescriptionSchema = z.object({
  notes: z.string().optional(),
});

export const DispensePrescriptionSchema = z.object({
  notes: z.string().optional(),
});

export const CancelPrescriptionSchema = z.object({
  notes: z.string().optional(),
});

export const ListDrugsQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const ListPrescriptionsQuerySchema = z.object({
  patientId: z.string().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});
