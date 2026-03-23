import { Schema, model, Types } from 'mongoose';

export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'partial' | 'overdue' | 'void';

export interface ILineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  readonly total: number; // computed: quantity * unitPrice
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
  readonly subtotal: number;  // sum of lineItem.total (computed pre-save)
  taxRate: number;   // percentage, e.g. 10 = 10%, default 0
  readonly tax: number;       // taxRate% of subtotal (computed pre-save)
  discount: number;  // absolute amount, default 0
  readonly total: number;     // subtotal + tax - discount (computed pre-save)
  readonly amountPaid: number; // sum of payment amounts, default 0
  readonly balance: number;   // total - amountPaid (computed pre-save)
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
    quantity: { type: Number, required: true, min: [0.001, 'Quantity must be positive'] },
    unitPrice: { type: Number, required: true, min: [0, 'Unit price cannot be negative'] },
    total: { type: Number, required: true },
  },
  { _id: false }
);

const InsuranceSchema = new Schema<IInsurance>(
  {
    provider: { type: String, required: true },
    policyNumber: { type: String, required: true },
    coverageAmount: { type: Number, required: true, min: [0, 'Coverage amount cannot be negative'] },
  },
  { _id: false }
);

const PaymentSchema = new Schema<IPayment>(
  {
    amount: { type: Number, required: true, min: [0.01, 'Payment amount must be positive'] },
    method: { type: String, enum: ['cash', 'card', 'insurance', 'transfer'], required: true },
    paidAt: { type: Date, required: true },
    reference: { type: String },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
);

const InvoiceSchema = new Schema<IInvoice>(
  {
    invoiceId: { type: String, unique: true },
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
    taxRate: { type: Number, default: 0, max: [100, 'Tax rate cannot exceed 100%'] },
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
  // Use a writable alias so readonly interface fields can be set by the model internals.
  // External callers still see them as readonly via the IInvoice interface.
  const doc = this as typeof this & {
    subtotal: number; tax: number; total: number; amountPaid: number; balance: number;
  };

  // 1. Compute each lineItem.total
  for (const item of this.lineItems) {
    (item as { total: number }).total = item.quantity * item.unitPrice;
  }

  // 2. Compute subtotal
  doc.subtotal = this.lineItems.reduce((sum, item) => sum + item.total, 0);

  // 3. Compute tax
  doc.tax = Math.round((doc.subtotal * this.taxRate / 100) * 100) / 100;

  // 4. Compute total
  doc.total = doc.subtotal + doc.tax - this.discount;
  if (this.discount < 0) throw new Error('Discount cannot be negative');
  if (doc.total < 0) throw new Error('Discount cannot exceed subtotal + tax');

  // 5. Compute amountPaid
  doc.amountPaid = this.payments.reduce((sum, p) => sum + p.amount, 0);

  // 6. Compute balance
  doc.balance = doc.total - doc.amountPaid;

  // 7. Auto-generate invoiceId if not set
  // TODO: countDocuments-based ID generation is not race-condition safe under concurrent inserts.
  // For a production multi-instance deployment, use an atomic counter collection or MongoDB sequence pattern.
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
      // NOTE: overdue promotion only fires during an explicit .save(). A scheduled job must
      // periodically re-save issued invoices past their dueDate to promote them to 'overdue'.
      this.status = 'overdue';
    } else {
      this.status = 'issued';
    }
  }

  next();
});

InvoiceSchema.pre('validate', function (next) {
  if (this.status === 'void' && !this.voidReason) {
    return next(new Error('voidReason is required when voiding an invoice'));
  }
  next();
});

export const Invoice = model<IInvoice>('Invoice', InvoiceSchema);
