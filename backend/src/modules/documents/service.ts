import { Types } from 'mongoose';
import { z } from 'zod';
import { Document } from '../../models/Document';
import { Patient } from '../../models/Patient';
import { Doctor } from '../../models/Doctor';
import { User } from '../../models/User';
import { ForbiddenError, NotFoundError, ValidationError } from '../../middleware/errorHandler';
import { generateDocumentPdf } from '../../services/pdfService';
import { sendDocumentEmail } from '../../services/emailService';
import {
  CreateDocumentSchema,
  IssueDocumentSchema,
  VoidDocumentSchema,
  ListDocumentsQuerySchema,
} from './schema';

type CreateDocumentInput = z.infer<typeof CreateDocumentSchema>;
type IssueDocumentInput = z.infer<typeof IssueDocumentSchema>;
type VoidDocumentInput = z.infer<typeof VoidDocumentSchema>;
type ListDocumentsQuery = z.infer<typeof ListDocumentsQuerySchema>;

export async function createDocument(
  input: CreateDocumentInput,
  requestingUserId: string,
  isAdmin: boolean
) {
  const patient = await Patient.findById(input.patientId);
  if (!patient) throw new NotFoundError('Patient');

  const doctor = await Doctor.findById(input.issuedBy);
  if (!doctor) throw new NotFoundError('Doctor');

  // Non-admin doctors can only create documents they issue themselves
  if (!isAdmin) {
    const doctorProfile = await Doctor.findOne({ userId: requestingUserId });
    if (!doctorProfile || doctorProfile._id.toString() !== input.issuedBy) {
      throw new ForbiddenError('Doctors can only create documents they issue themselves');
    }
  }

  const doc = await Document.create({
    type: input.type,
    patientId: new Types.ObjectId(input.patientId),
    issuedBy: new Types.ObjectId(input.issuedBy),
    templateData: input.templateData,
    content: input.content,
    notes: input.notes,
    status: 'draft',
  });

  return doc;
}

export async function listDocuments(
  filters: ListDocumentsQuery,
  requestingUserId: string,
  requestingRole: string,
  ownOnly?: boolean
) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const skip = (page - 1) * limit;
  const query: Record<string, unknown> = {};

  if (ownOnly) {
    // Patient: see only their own documents
    const patientProfile = await Patient.findOne({ userId: requestingUserId }).lean();
    if (!patientProfile) {
      return { data: [], total: 0, page, limit, totalPages: 0 };
    }
    query.patientId = (patientProfile._id as Types.ObjectId);
  } else if (requestingRole === 'doctor') {
    // Doctor: see only documents they issued
    const doctorProfile = await Doctor.findOne({ userId: requestingUserId }).lean();
    if (!doctorProfile) {
      return { data: [], total: 0, page, limit, totalPages: 0 };
    }
    query.issuedBy = (doctorProfile._id as Types.ObjectId);
  } else {
    // Admin: optional filter by patientId
    if (filters.patientId) {
      query.patientId = new Types.ObjectId(filters.patientId);
    }
  }

  if (filters.type) {
    query.type = filters.type;
  }

  if (filters.status) {
    query.status = filters.status;
  }

  const [data, total] = await Promise.all([
    Document.find(query)
      .populate('patientId')
      .populate('issuedBy')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Document.countDocuments(query),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getDocumentById(
  documentId: string,
  requestingUserId: string,
  ownOnly?: boolean
) {
  const doc = await Document.findById(documentId)
    .populate('patientId')
    .populate('issuedBy');

  if (!doc) throw new NotFoundError('Document');

  if (ownOnly) {
    // Patient: only own documents
    const patientDoc = doc.patientId as unknown as { userId?: { toString(): string } | Types.ObjectId };
    const patientUserId =
      patientDoc.userId && typeof patientDoc.userId === 'object' && '_id' in patientDoc.userId
        ? (patientDoc.userId as Types.ObjectId & { _id?: Types.ObjectId })._id?.toString() ?? patientDoc.userId.toString()
        : patientDoc.userId?.toString();

    if (!patientUserId || patientUserId !== requestingUserId) {
      throw new ForbiddenError('You can only view your own documents');
    }
  }

  return doc;
}

export async function issueDocument(
  documentId: string,
  input: IssueDocumentInput,
  requestingUserId: string,
  isAdmin: boolean
) {
  const doc = await Document.findById(documentId);
  if (!doc) throw new NotFoundError('Document');

  // Terminal state guard
  if (doc.status !== 'draft') {
    throw new ValidationError(`Cannot issue a document with status '${doc.status}'`);
  }

  // Doctor can only issue their own documents
  if (!isAdmin) {
    const doctorProfile = await Doctor.findOne({ userId: requestingUserId });
    if (!doctorProfile || doctorProfile._id.toString() !== doc.issuedBy.toString()) {
      throw new ForbiddenError('Doctors can only issue their own documents');
    }
  }

  if (input.notes) {
    doc.notes = input.notes;
  }

  doc.status = 'issued';
  doc.issuedAt = new Date();
  doc.pdfUrl = `documents/${doc.documentId}.pdf`;

  await doc.save();

  // Generate PDF
  const pdfBuffer = await generateDocumentPdf(doc);

  // Send email to patient
  try {
    const patientProfile = await Patient.findById(doc.patientId);
    if (patientProfile) {
      const patientUser = await User.findById(patientProfile.userId);
      if (patientUser?.email) {
        const patientName = `${patientUser.firstName} ${patientUser.lastName}`;
        await sendDocumentEmail(patientUser.email, doc.type, patientName, pdfBuffer);
      }
    }
  } catch {
    // Non-fatal: email errors should not block the response
  }

  return doc;
}

export async function voidDocument(
  documentId: string,
  input: VoidDocumentInput,
  requestingUserId: string,
  isAdmin: boolean
) {
  const doc = await Document.findById(documentId);
  if (!doc) throw new NotFoundError('Document');

  // Can only void issued documents
  if (doc.status !== 'issued') {
    throw new ValidationError(`Cannot void a document with status '${doc.status}'. Document must be issued first.`);
  }

  // Doctor can only void their own documents
  if (!isAdmin) {
    const doctorProfile = await Doctor.findOne({ userId: requestingUserId });
    if (!doctorProfile || doctorProfile._id.toString() !== doc.issuedBy.toString()) {
      throw new ForbiddenError('Doctors can only void their own documents');
    }
  }

  doc.status = 'void';
  doc.voidedAt = new Date();
  doc.voidReason = input.voidReason;

  await doc.save();
  return doc;
}
