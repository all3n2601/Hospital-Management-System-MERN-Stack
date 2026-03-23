import { z } from 'zod';

export const CreateInvoiceSchema = z.object({
  patientId: z.string().min(1),
  appointmentId: z.string().optional(),
  lineItems: z.array(
    z.object({
      description: z.string().min(1),
      quantity: z.number().gt(0),
      unitPrice: z.number().gte(0),
    })
  ).min(1),
  taxRate: z.number().min(0).max(100).default(0),
  discount: z.number().gte(0).default(0),
  insurance: z
    .object({
      provider: z.string().min(1),
      policyNumber: z.string().min(1),
      coverageAmount: z.number().gte(0),
    })
    .optional(),
  dueDate: z.string().datetime({ offset: true }).optional(),
  notes: z.string().optional(),
});

export const RecordPaymentSchema = z.object({
  amount: z.number().gt(0),
  method: z.enum(['cash', 'card', 'insurance', 'transfer']),
  reference: z.string().optional(),
  paidAt: z.string().datetime({ offset: true }).optional(),
});

export const VoidInvoiceSchema = z.object({
  voidReason: z.string().min(1),
});

export const ListInvoicesQuerySchema = z.object({
  patientId: z.string().optional(),
  status: z.string().optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().max(100).default(20),
});
