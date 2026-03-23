export interface Drug {
  _id: string;
  name: string;
  code: string;
  category: string;
  unit: string;
  stockQuantity: number;
  reorderLevel: number;
  description?: string;
}

export type PrescriptionStatus = 'draft' | 'active' | 'dispensed' | 'cancelled';

export interface PrescriptionLineItem {
  drugId: string | Drug;
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity?: number;
}

export interface Prescription {
  _id: string;
  prescriptionId: string;
  patient: { _id: string; userId?: { firstName: string; lastName: string; email: string } };
  doctor: { _id: string; userId?: { firstName: string; lastName: string } };
  appointmentId?: string;
  lineItems: PrescriptionLineItem[];
  status: PrescriptionStatus;
  notes?: string;
  dispensedBy?: { _id: string; firstName: string; lastName: string };
  dispensedAt?: string;
  createdAt: string;
}
