export type DocumentType = 'medical_certificate' | 'discharge_summary' | 'referral' | 'lab_report';
export type DocumentStatus = 'draft' | 'issued' | 'void';

export interface Document {
  _id: string;
  documentId: string;
  type: DocumentType;
  patientId: { _id: string; userId?: { firstName: string; lastName: string; email: string } };
  issuedBy: { _id: string; userId?: { firstName: string; lastName: string } };
  templateData?: Record<string, unknown>;
  content?: string;
  pdfUrl?: string;
  status: DocumentStatus;
  notes?: string;
  issuedAt?: string;
  voidedAt?: string;
  voidReason?: string;
  createdAt: string;
}
