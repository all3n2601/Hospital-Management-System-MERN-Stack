import { z } from 'zod';

export const CreateInventoryItemSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  category: z.string().min(1),
  quantity: z.number().int().min(0).optional(),
  unit: z.string().min(1),
  reorderLevel: z.number().int().min(0).optional(),
  expiryDate: z.coerce.date().optional(),
  supplier: z.string().optional(),
  description: z.string().optional(),
});

export const UpdateInventoryItemSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  unit: z.string().min(1).optional(),
  reorderLevel: z.number().int().min(0).optional(),
  expiryDate: z.coerce.date().optional(),
  supplier: z.string().optional(),
  description: z.string().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

export const AdjustStockSchema = z.object({
  type: z.enum(['in', 'out', 'adjustment', 'waste']),
  quantity: z.number().int().min(1),
  reason: z.string().optional(),
});

export const ListInventoryQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  lowStock: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const ListMovementsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});
