import { z } from 'zod';

export const CreateDocumentSchema = z.object({
  type: z.enum(['medical_certificate', 'discharge_summary', 'referral', 'lab_report']),
  patientId: z.string().min(1),
  issuedBy: z.string().min(1),
  templateData: z.record(z.unknown()).optional(),
  content: z.string().optional(),
  notes: z.string().optional(),
});

export const IssueDocumentSchema = z.object({
  notes: z.string().optional(),
});

export const VoidDocumentSchema = z.object({
  voidReason: z.string().min(1, 'voidReason is required'),
});

export const ListDocumentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  patientId: z.string().optional(),
  type: z.enum(['medical_certificate', 'discharge_summary', 'referral', 'lab_report']).optional(),
  status: z.enum(['draft', 'issued', 'void']).optional(),
});
