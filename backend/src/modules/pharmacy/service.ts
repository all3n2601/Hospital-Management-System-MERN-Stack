import { Types } from 'mongoose';
import { z } from 'zod';
import { Drug } from '../../models/Drug';
import { Prescription } from '../../models/Prescription';
import { Patient } from '../../models/Patient';
import { Doctor } from '../../models/Doctor';
import { ForbiddenError, NotFoundError, ValidationError } from '../../middleware/errorHandler';
import { emitToRole } from '../../socket';
import {
  CreateDrugSchema,
  UpdateDrugSchema,
  CreatePrescriptionSchema,
  ActivatePrescriptionSchema,
  DispensePrescriptionSchema,
  CancelPrescriptionSchema,
  ListDrugsQuerySchema,
  ListPrescriptionsQuerySchema,
} from './schema';

type CreateDrugInput = z.infer<typeof CreateDrugSchema>;
type UpdateDrugInput = z.infer<typeof UpdateDrugSchema>;
type CreatePrescriptionInput = z.infer<typeof CreatePrescriptionSchema>;
type ActivatePrescriptionInput = z.infer<typeof ActivatePrescriptionSchema>;
type DispensePrescriptionInput = z.infer<typeof DispensePrescriptionSchema>;
type CancelPrescriptionInput = z.infer<typeof CancelPrescriptionSchema>;
type ListDrugsQuery = z.infer<typeof ListDrugsQuerySchema>;
type ListPrescriptionsQuery = z.infer<typeof ListPrescriptionsQuerySchema>;

// ---------------------------------------------------------------------------
// Drug services
// ---------------------------------------------------------------------------

export async function createDrug(input: CreateDrugInput) {
  const drug = await Drug.create({
    name: input.name,
    code: input.code,
    category: input.category,
    unit: input.unit,
    stockQuantity: input.stockQuantity ?? 0,
    reorderLevel: input.reorderLevel,
    description: input.description,
  });
  return drug;
}

export async function listDrugs(query: ListDrugsQuery) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;
  const filter: Record<string, unknown> = {};

  if (query.search) {
    const regex = new RegExp(query.search, 'i');
    filter.$or = [{ name: regex }, { code: regex }, { category: regex }];
  }

  const [data, total] = await Promise.all([
    Drug.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
    Drug.countDocuments(filter),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getDrugById(id: string) {
  const drug = await Drug.findById(id);
  if (!drug) throw new NotFoundError('Drug');
  return drug;
}

export async function updateDrug(id: string, input: UpdateDrugInput) {
  const drug = await Drug.findByIdAndUpdate(id, { $set: input }, { new: true, runValidators: true });
  if (!drug) throw new NotFoundError('Drug');
  return drug;
}

// ---------------------------------------------------------------------------
// Prescription services
// ---------------------------------------------------------------------------

export async function createPrescription(input: CreatePrescriptionInput, requestingUserId: string) {
  const patient = await Patient.findById(input.patientId);
  if (!patient) throw new NotFoundError('Patient');

  const doctor = await Doctor.findById(input.doctorId);
  if (!doctor) throw new NotFoundError('Doctor');

  const prescription = await Prescription.create({
    patientId: new Types.ObjectId(input.patientId),
    doctorId: new Types.ObjectId(input.doctorId),
    appointmentId: input.appointmentId ? new Types.ObjectId(input.appointmentId) : undefined,
    lineItems: input.lineItems.map(item => ({
      drugId: new Types.ObjectId(item.drugId),
      drugName: item.drugName,
      dosage: item.dosage,
      frequency: item.frequency,
      duration: item.duration,
      quantity: item.quantity ?? 1,
    })),
    notes: input.notes,
    status: 'draft',
  });

  return prescription;
}

export async function listPrescriptions(
  query: ListPrescriptionsQuery,
  requestingUserId: string,
  requestingRole: string,
  ownOnly?: boolean
) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;
  const filter: Record<string, unknown> = {};

  if (ownOnly) {
    // patient own-read: filter by patient profile
    const patientProfile = await Patient.findOne({ userId: requestingUserId }).lean();
    if (!patientProfile) {
      return { data: [], total: 0, page, limit, totalPages: 0 };
    }
    filter.patientId = (patientProfile._id as Types.ObjectId);
  } else if (requestingRole === 'nurse') {
    // nurse sees active prescriptions only
    filter.status = 'active';
  } else if (query.patientId) {
    filter.patientId = new Types.ObjectId(query.patientId);
  }

  if (query.status && requestingRole !== 'nurse') {
    const statuses = query.status.split(',').map(s => s.trim()).filter(Boolean);
    filter.status = statuses.length === 1 ? statuses[0] : { $in: statuses };
  }

  const [data, total] = await Promise.all([
    Prescription.find(filter)
      .populate('patientId')
      .populate('doctorId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Prescription.countDocuments(filter),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getPrescriptionById(
  id: string,
  requestingUserId: string,
  ownOnly?: boolean
) {
  const prescription = await Prescription.findById(id)
    .populate('patientId')
    .populate('doctorId');

  if (!prescription) throw new NotFoundError('Prescription');

  if (ownOnly) {
    // Check if patient owns this prescription
    const patientDoc = prescription.patientId as unknown as { userId?: Types.ObjectId | { toString(): string } };
    const patientUserId = patientDoc?.userId?.toString();
    if (!patientUserId || patientUserId !== requestingUserId) {
      throw new ForbiddenError('You can only view your own prescriptions');
    }
  }

  return prescription;
}

export async function activatePrescription(
  id: string,
  input: ActivatePrescriptionInput,
  requestingUserId: string
) {
  const prescription = await Prescription.findById(id);
  if (!prescription) throw new NotFoundError('Prescription');

  // Terminal state guard
  if (prescription.status === 'dispensed' || prescription.status === 'cancelled') {
    throw new ValidationError(
      `Cannot activate prescription with status '${prescription.status}'`
    );
  }

  if (prescription.status !== 'draft') {
    throw new ValidationError(
      `Cannot transition from '${prescription.status}' to 'active'`
    );
  }

  prescription.status = 'active';
  if (input.notes) {
    prescription.notes = prescription.notes
      ? `${prescription.notes}\n${input.notes}`
      : input.notes;
  }

  await prescription.save();
  return prescription;
}

export async function dispensePrescription(
  id: string,
  input: DispensePrescriptionInput,
  dispensingUserId: string
) {
  const prescription = await Prescription.findById(id);
  if (!prescription) throw new NotFoundError('Prescription');

  // Terminal state guard
  if (prescription.status === 'dispensed' || prescription.status === 'cancelled') {
    throw new ValidationError(
      `Cannot dispense prescription with status '${prescription.status}'`
    );
  }

  if (prescription.status !== 'active') {
    throw new ValidationError(
      `Cannot dispense prescription with status '${prescription.status}'. Must be 'active'.`
    );
  }

  // Deduct stock for each line item
  for (const item of prescription.lineItems) {
    const drug = await Drug.findById(item.drugId);
    if (!drug) throw new NotFoundError(`Drug ${item.drugName}`);

    const deductQty = item.quantity ?? 1;
    drug.stockQuantity = Math.max(0, drug.stockQuantity - deductQty);
    await drug.save();

    // Emit low stock alert if stock drops below or equals reorder level
    if (drug.stockQuantity <= drug.reorderLevel) {
      emitToRole('admin', 'pharmacy:low-stock', {
        drugId: drug._id.toString(),
        drugName: drug.name,
        currentStock: drug.stockQuantity,
        reorderLevel: drug.reorderLevel,
      });
    }
  }

  prescription.status = 'dispensed';
  prescription.dispensedBy = new Types.ObjectId(dispensingUserId);
  prescription.dispensedAt = new Date();
  if (input.notes) {
    prescription.notes = prescription.notes
      ? `${prescription.notes}\n${input.notes}`
      : input.notes;
  }

  await prescription.save();
  return prescription;
}

export async function cancelPrescription(
  id: string,
  input: CancelPrescriptionInput,
  requestingUserId: string
) {
  const prescription = await Prescription.findById(id);
  if (!prescription) throw new NotFoundError('Prescription');

  // Terminal state guard
  if (prescription.status === 'dispensed' || prescription.status === 'cancelled') {
    throw new ValidationError(
      `Cannot cancel prescription with status '${prescription.status}'`
    );
  }

  prescription.status = 'cancelled';
  if (input.notes) {
    prescription.notes = prescription.notes
      ? `${prescription.notes}\n${input.notes}`
      : input.notes;
  }

  await prescription.save();
  return prescription;
}
