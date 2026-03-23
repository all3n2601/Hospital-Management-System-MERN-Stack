export interface ILabTestItem {
  name: string;
  code: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

export interface ILabResultItem {
  testCode: string;
  testName: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  isNormal?: boolean;
}

export type LabOrderStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type LabOrderPriority = 'routine' | 'urgent' | 'stat';
export type LabResultStatus = 'preliminary' | 'final' | 'amended';

export interface LabOrder {
  _id: string;
  orderId: string;
  patient: { _id: string; userId?: { firstName: string; lastName: string; email: string } };
  doctor: { _id: string; userId?: { firstName: string; lastName: string } };
  tests: ILabTestItem[];
  priority: LabOrderPriority;
  status: LabOrderStatus;
  notes?: string;
  orderedAt: string;
  createdAt: string;
}

export interface LabResult {
  _id: string;
  labOrder: string | LabOrder;
  patient: string;
  results: ILabResultItem[];
  technician: { _id: string; firstName?: string; lastName?: string; name?: string };
  verifiedBy?: { _id: string; userId?: { firstName: string; lastName: string } };
  reportUrl?: string;
  notes?: string;
  status: LabResultStatus;
  collectedAt?: string;
  resultedAt?: string;
  verifiedAt?: string;
  createdAt: string;
}
