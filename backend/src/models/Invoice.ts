import { Schema, model, Types } from 'mongoose';

export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'partial' | 'overdue' | 'void';

export interface ILineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number; // computed: quantity * unitPrice
}

export interface IInsurance {
  provider: string;
  policyNumber: string;
  coverageAmount: number;
}

export interface IPayment {
  amount: number;
  method: 'cash' | 'card' | 'insurance' | 'transfer';
  paidAt: Date;
  reference?: string;
  recordedBy: Types.ObjectId; // ref User
}

export interface IInvoice {
  _id: Types.ObjectId;
  invoiceId: string; // INV-XXXX
  patient: Types.ObjectId;       // ref Patient
  appointment?: Types.ObjectId;  // ref Appointment
  lineItems: ILineItem[];
  subtotal: number;  // sum of lineItem.total (computed pre-save)
  taxRate: number;   // percentage, e.g. 10 = 10%, default 0
  tax: number;       // taxRate% of subtotal (computed pre-save)
  discount: number;  // absolute amount, default 0
  total: number;     // subtotal + tax - discount (computed pre-save)
  amountPaid: number; // sum of payment amounts, default 0
  balance: number;   // total - amountPaid (computed pre-save)
  status: InvoiceStatus;
  insurance?: IInsurance;
  payments: IPayment[];
  issuedDate?: Date;
  dueDate?: Date;
  paidDate?: Date;
  notes?: string;
  issuedBy: Types.ObjectId;  // ref User, required
  voidedBy?: Types.ObjectId; // ref User
  voidReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LineItemSchema = new Schema<ILineItem>(
  {
    description: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  { _id: false }
);

const InsuranceSchema = new Schema<IInsurance>(
  {
    provider: { type: String, required: true },
    policyNumber: { type: String, required: true },
    coverageAmount: { type: Number, required: true },
  },
  { _id: false }
);

const PaymentSchema = new Schema<IPayment>(
  {
    amount: { type: Number, required: true },
    method: { type: String, enum: ['cash', 'card', 'insurance', 'transfer'], required: true },
    paidAt: { type: Date, required: true },
    reference: { type: String },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { _id: false }
);

const InvoiceSchema = new Schema<IInvoice>(
  {
    invoiceId: { type: String, unique: true, index: true },
    patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    appointment: { type: Schema.Types.ObjectId, ref: 'Appointment' },
    lineItems: {
      type: [LineItemSchema],
      required: true,
      validate: {
        validator: (v: ILineItem[]) => v && v.length >= 1,
        message: 'Invoice must have at least one line item',
      },
    },
    subtotal: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    amountPaid: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['draft', 'issued', 'paid', 'partial', 'overdue', 'void'],
      default: 'draft',
      index: true,
    },
    insurance: { type: InsuranceSchema },
    payments: { type: [PaymentSchema], default: [] },
    issuedDate: { type: Date },
    dueDate: { type: Date },
    paidDate: { type: Date },
    notes: { type: String },
    issuedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    voidedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    voidReason: { type: String },
  },
  { timestamps: true }
);

// Compound index for common query pattern
InvoiceSchema.index({ patient: 1, status: 1 });

// Pre-save hook: compute all derived fields and auto-generate invoiceId
InvoiceSchema.pre('save', async function (next) {
  // 1. Compute each lineItem.total
  for (const item of this.lineItems) {
    item.total = item.quantity * item.unitPrice;
  }

  // 2. Compute subtotal
  this.subtotal = this.lineItems.reduce((sum, item) => sum + item.total, 0);

  // 3. Compute tax
  this.tax = Math.round((this.subtotal * this.taxRate / 100) * 100) / 100;

  // 4. Compute total
  this.total = this.subtotal + this.tax - this.discount;

  // 5. Compute amountPaid
  this.amountPaid = this.payments.reduce((sum, p) => sum + p.amount, 0);

  // 6. Compute balance
  this.balance = this.total - this.amountPaid;

  // 7. Auto-generate invoiceId if not set
  if (!this.invoiceId) {
    const count = await (this.constructor as typeof Invoice).countDocuments();
    this.invoiceId = `INV-${String(count + 1).padStart(4, '0')}`;
  }

  // 8. Auto-update status (only if not 'draft' or 'void')
  if (this.status !== 'draft' && this.status !== 'void') {
    if (this.balance <= 0) {
      this.status = 'paid';
      if (!this.paidDate) {
        this.paidDate = new Date();
      }
    } else if (this.amountPaid > 0) {
      this.status = 'partial';
    } else if (this.issuedDate && this.dueDate && new Date() > this.dueDate) {
      this.status = 'overdue';
    } else {
      this.status = 'issued';
    }
  }

  next();
});

export const Invoice = model<IInvoice>('Invoice', InvoiceSchema);
