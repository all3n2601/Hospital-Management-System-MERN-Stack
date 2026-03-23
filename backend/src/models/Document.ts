import { Schema, model, Types } from 'mongoose';

export type DocumentType = 'medical_certificate' | 'discharge_summary' | 'referral' | 'lab_report';
export type DocumentStatus = 'draft' | 'issued' | 'void';

export interface IDocument {
  _id: Types.ObjectId;
  documentId: string; // DOC-XXXX auto-generated
  type: DocumentType;
  patientId: Types.ObjectId; // ref Patient
  issuedBy: Types.ObjectId;  // ref Doctor
  templateData?: Record<string, unknown>;
  content?: string;
  pdfUrl?: string;
  status: DocumentStatus;
  issuedAt?: Date;
  voidedAt?: Date;
  voidReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    documentId: { type: String, unique: true, index: true },
    type: {
      type: String,
      enum: ['medical_certificate', 'discharge_summary', 'referral', 'lab_report'],
      required: true,
    },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    issuedBy: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    templateData: { type: Schema.Types.Mixed },
    content: { type: String },
    pdfUrl: { type: String },
    status: {
      type: String,
      enum: ['draft', 'issued', 'void'],
      default: 'draft',
      index: true,
    },
    issuedAt: { type: Date },
    voidedAt: { type: Date },
    voidReason: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

// Auto-generate documentId before save
DocumentSchema.pre('save', async function (next) {
  if (!this.documentId) {
    const count = await (this.constructor as typeof Document).countDocuments();
    this.documentId = `DOC-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

export const Document = model<IDocument>('Document', DocumentSchema);
