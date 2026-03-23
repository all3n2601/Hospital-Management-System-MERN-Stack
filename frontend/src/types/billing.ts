export interface ILineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface IPayment {
  _id?: string;
  amount: number;
  method: 'cash' | 'card' | 'insurance' | 'transfer';
  paidAt: string;
  reference?: string;
}

export interface IInsurance {
  provider: string;
  policyNumber: string;
  coverageAmount: number;
}

export interface Invoice {
  _id: string;
  invoiceId: string;
  patient: { _id: string; userId: { firstName: string; lastName: string } };
  appointment?: string;
  lineItems: ILineItem[];
  subtotal: number;
  taxRate: number; // whole number percentage (10 = 10%)
  tax: number;
  discount: number;
  total: number;
  amountPaid: number;
  balance: number;
  status: 'draft' | 'issued' | 'paid' | 'partial' | 'overdue' | 'void';
  insurance?: IInsurance;
  payments: IPayment[];
  issuedDate?: string;
  dueDate?: string;
  paidDate?: string;
  notes?: string;
  createdAt: string;
}
