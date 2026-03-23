import { Types } from 'mongoose';
import { z } from 'zod';
import { LabOrder } from '../../models/LabOrder';
import { LabResult } from '../../models/LabResult';
import { Patient } from '../../models/Patient';
import { Doctor } from '../../models/Doctor';
import { ForbiddenError, NotFoundError, ValidationError } from '../../middleware/errorHandler';
import {
  CreateLabOrderSchema,
  UpdateOrderStatusSchema,
  CreateLabResultSchema,
  VerifyResultSchema,
  ListLabOrdersQuerySchema,
} from './schema';

type CreateLabOrderInput = z.infer<typeof CreateLabOrderSchema>;
type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;
type CreateLabResultInput = z.infer<typeof CreateLabResultSchema>;
type VerifyResultInput = z.infer<typeof VerifyResultSchema>;
type ListLabOrdersQuery = z.infer<typeof ListLabOrdersQuerySchema>;

export async function createLabOrder(input: CreateLabOrderInput, requestingUserId: string) {
  const patient = await Patient.findById(input.patientId);
  if (!patient) throw new NotFoundError('Patient');

  const doctor = await Doctor.findById(input.doctorId);
  if (!doctor) throw new NotFoundError('Doctor');

  const order = await LabOrder.create({
    patient: new Types.ObjectId(input.patientId),
    doctor: new Types.ObjectId(input.doctorId),
    appointment: input.appointmentId ? new Types.ObjectId(input.appointmentId) : undefined,
    tests: input.tests.map(t => ({ name: t.name, code: t.code, status: 'pending' })),
    priority: input.priority ?? 'routine',
    notes: input.notes,
    status: 'pending',
  });

  return order;
}

export async function listLabOrders(
  filters: ListLabOrdersQuery,
  requestingUserId: string,
  ownOnly?: boolean
) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const skip = (page - 1) * limit;
  const query: Record<string, unknown> = {};

  if (ownOnly) {
    const patientProfile = await Patient.findOne({ userId: requestingUserId }).lean();
    if (!patientProfile) {
      return { data: [], total: 0, page, limit, totalPages: 0 };
    }
    query.patient = (patientProfile._id as Types.ObjectId);
  } else if (filters.patientId) {
    query.patient = new Types.ObjectId(filters.patientId);
  }

  if (filters.status) {
    const statuses = filters.status.split(',').map(s => s.trim()).filter(Boolean);
    query.status = statuses.length === 1 ? statuses[0] : { $in: statuses };
  }

  if (filters.priority) {
    query.priority = filters.priority;
  }

  const [data, total] = await Promise.all([
    LabOrder.find(query)
      .populate({ path: 'patient', populate: { path: 'userId', select: '-password' } })
      .populate('doctor')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    LabOrder.countDocuments(query),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getLabOrderById(
  orderId: string,
  requestingUserId: string,
  ownOnly?: boolean
) {
  const order = await LabOrder.findById(orderId)
    .populate({ path: 'patient', populate: { path: 'userId', select: '-password' } })
    .populate('doctor');

  if (!order) throw new NotFoundError('Lab order');

  if (ownOnly) {
    const patientDoc = order.patient as unknown as { userId: Types.ObjectId | { toString(): string } };
    const patientUserId = patientDoc.userId?.toString();
    if (!patientUserId || patientUserId !== requestingUserId) {
      throw new ForbiddenError('You can only view your own lab orders');
    }
  }

  return order;
}

export async function updateLabOrderStatus(orderId: string, input: UpdateOrderStatusInput) {
  const order = await LabOrder.findById(orderId);
  if (!order) throw new NotFoundError('Lab order');

  const VALID_TRANSITIONS: Record<string, string[]> = {
    pending: ['in_progress', 'cancelled'],
    in_progress: ['completed', 'cancelled'],
    completed: [],   // terminal
    cancelled: [],   // terminal
  };

  const allowed = VALID_TRANSITIONS[order.status] ?? [];
  if (!allowed.includes(input.status)) {
    throw new ValidationError(`Cannot transition from '${order.status}' to '${input.status}'`);
  }

  order.status = input.status;

  if (input.status === 'completed') {
    order.tests = order.tests.map(test => ({
      ...test,
      status: (test.status === 'pending' || test.status === 'in_progress') ? 'completed' : test.status,
    })) as typeof order.tests;
  }

  await order.save();
  return order;
}

export async function createLabResult(input: CreateLabResultInput, technicianUserId: string) {
  const labOrder = await LabOrder.findById(input.labOrderId);
  if (!labOrder) throw new NotFoundError('Lab order');

  const existing = await LabResult.findOne({ labOrder: new Types.ObjectId(input.labOrderId) });
  if (existing) throw new ValidationError('A result already exists for this lab order');

  const result = await LabResult.create({
    labOrder: new Types.ObjectId(input.labOrderId),
    patient: labOrder.patient,
    results: input.results,
    technician: new Types.ObjectId(technicianUserId),
    collectedAt: input.collectedAt ? new Date(input.collectedAt) : undefined,
    resultedAt: input.resultedAt ? new Date(input.resultedAt) : new Date(),
    notes: input.notes,
    reportUrl: input.reportUrl,
    status: 'preliminary',
  });

  return result;
}

export async function getLabResultByOrderId(
  orderId: string,
  requestingUserId: string,
  ownOnly?: boolean
) {
  const result = await LabResult.findOne({ labOrder: new Types.ObjectId(orderId) })
    .populate({
      path: 'labOrder',
      populate: { path: 'patient', populate: { path: 'userId', select: '-password' } },
    })
    .populate('technician', 'firstName lastName name')
    .populate('verifiedBy');

  if (!result) throw new NotFoundError('Lab result');

  if (ownOnly) {
    const labOrderDoc = result.labOrder as unknown as {
      patient: { userId: Types.ObjectId | { _id?: Types.ObjectId; toString(): string } };
    };
    const rawUserId = labOrderDoc?.patient?.userId;
    // userId may be a populated User document (has _id) or a raw ObjectId
    const patientUserId =
      rawUserId && typeof rawUserId === 'object' && '_id' in rawUserId
        ? (rawUserId._id as Types.ObjectId).toString()
        : rawUserId?.toString();
    if (!patientUserId || patientUserId !== requestingUserId) {
      throw new ForbiddenError('You can only view your own lab results');
    }
  }

  return result;
}

export async function verifyLabResult(
  resultId: string,
  input: VerifyResultInput,
  verifyingUserId: string
) {
  const result = await LabResult.findById(resultId);
  if (!result) throw new NotFoundError('Lab result');

  if (result.verifiedBy) {
    throw new ValidationError('Lab result has already been verified');
  }

  result.verifiedBy = new Types.ObjectId(verifyingUserId);
  result.verifiedAt = new Date();
  result.status = 'final';

  if (input.notes) {
    result.notes = result.notes ? `${result.notes}\n${input.notes}` : input.notes;
  }

  await result.save();
  return result;
}
