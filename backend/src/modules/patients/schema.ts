import { z } from 'zod';

export const CreatePatientSchema = z.object({
  userId: z.string().optional(), // if provided, link to existing user; otherwise create user too
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  phone: z.string().optional(),
  dob: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']).optional(),
  allergies: z.array(z.string()).optional(),
  emergencyContact: z
    .object({
      name: z.string(),
      relationship: z.string(),
      phone: z.string(),
    })
    .optional(),
  insuranceInfo: z
    .object({
      provider: z.string(),
      policyNumber: z.string(),
      expiryDate: z.string().optional(),
    })
    .optional(),
});

export const UpdatePatientSchema = z.object({
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']).optional(),
  allergies: z.array(z.string()).optional(),
  emergencyContact: z
    .object({
      name: z.string(),
      relationship: z.string(),
      phone: z.string(),
    })
    .optional(),
  insuranceInfo: z
    .object({
      provider: z.string(),
      policyNumber: z.string(),
      expiryDate: z.string().optional(),
    })
    .optional(),
  phone: z.string().optional(),
  dob: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
});
