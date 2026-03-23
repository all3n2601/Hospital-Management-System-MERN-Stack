import { Types } from 'mongoose';
import { z } from 'zod';
import { Invoice } from '../../models/Invoice';
import { Patient } from '../../models/Patient';
import { ForbiddenError, NotFoundError, ValidationError } from '../../middleware/errorHandler';
import { CreateInvoiceSchema, RecordPaymentSchema, VoidInvoiceSchema, ListInvoicesQuerySchema } from './schema';

type CreateInvoiceInput = z.infer<typeof CreateInvoiceSchema>;
type RecordPaymentInput = z.infer<typeof RecordPaymentSchema>;
type VoidInvoiceInput = z.infer<typeof VoidInvoiceSchema>;
type ListInvoicesQuery = z.infer<typeof ListInvoicesQuerySchema>;

export async function createInvoice(input: CreateInvoiceInput, issuedByUserId: string) {
  const patient = await Patient.findById(input.patientId);
  if (!patient) throw new NotFoundError('Patient');

  const invoice = await Invoice.create({
    patient: new Types.ObjectId(input.patientId),
    appointment: input.appointmentId ? new Types.ObjectId(input.appointmentId) : undefined,
    lineItems: input.lineItems,
    taxRate: input.taxRate,
    discount: input.discount,
    insurance: input.insurance,
    dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
    notes: input.notes,
    status: 'draft',
    issuedBy: new Types.ObjectId(issuedByUserId),
  });

  return invoice;
}

export async function issueInvoice(invoiceId: string) {
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) throw new NotFoundError('Invoice');

  if (invoice.status !== 'draft') {
    throw new ValidationError('Invoice must be in draft status to be issued');
  }

  invoice.status = 'issued';
  invoice.issuedDate = new Date();

  await invoice.save();
  return invoice;
}

export async function recordPayment(
  invoiceId: string,
  input: RecordPaymentInput,
  recordedByUserId: string,
  requestingRole: string
) {
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) throw new NotFoundError('Invoice');

  if (requestingRole !== 'admin' && requestingRole !== 'receptionist') {
    throw new ForbiddenError('Only admins and receptionists can record payments');
  }

  if (invoice.status === 'draft' || invoice.status === 'void') {
    throw new ValidationError(`Cannot record payment on a ${invoice.status} invoice`);
  }

  invoice.payments.push({
    amount: input.amount,
    method: input.method,
    paidAt: input.paidAt ? new Date(input.paidAt) : new Date(),
    reference: input.reference,
    recordedBy: new Types.ObjectId(recordedByUserId),
  });

  await invoice.save();
  return invoice;
}

export async function voidInvoice(
  invoiceId: string,
  input: VoidInvoiceInput,
  requestingUserId: string
) {
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) throw new NotFoundError('Invoice');

  if (invoice.status === 'paid') {
    throw new ValidationError('Cannot void a paid invoice');
  }

  invoice.status = 'void';
  invoice.voidedBy = new Types.ObjectId(requestingUserId);
  invoice.voidReason = input.voidReason;

  await invoice.save();
  return invoice;
}

export async function listInvoices(
  filters: ListInvoicesQuery,
  requestingUserId: string,
  requestingRole: string,
  ownOnly?: boolean
) {
  const { page = 1, limit = 20 } = filters;
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

  const [data, total] = await Promise.all([
    Invoice.find(query)
      .populate({ path: 'patient', populate: { path: 'userId', select: '-password' } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Invoice.countDocuments(query),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getInvoiceById(
  invoiceId: string,
  requestingUserId: string,
  requestingRole: string,
  ownOnly?: boolean
) {
  const invoice = await Invoice.findById(invoiceId)
    .populate({ path: 'patient', populate: { path: 'userId', select: '-password' } })
    .populate('appointment');

  if (!invoice) throw new NotFoundError('Invoice');

  if (ownOnly) {
    const patientDoc = invoice.patient as unknown as { userId: Types.ObjectId | { _id: Types.ObjectId; toString(): string } };
    const patientUserId = patientDoc.userId?.toString();
    if (!patientUserId || patientUserId !== requestingUserId) {
      throw new ForbiddenError('You can only view your own invoices');
    }
  }

  return invoice;
}
