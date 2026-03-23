import { Schema, model, Types } from 'mongoose';

export type PrescriptionStatus = 'draft' | 'active' | 'dispensed' | 'cancelled';

export interface IPrescriptionLineItem {
  drugId: Types.ObjectId;
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity?: number;
}

export interface IPrescription {
  _id: Types.ObjectId;
  prescriptionId: string;  // auto-generated RX-XXXX
  patientId: Types.ObjectId;       // ref Patient
  doctorId: Types.ObjectId;        // ref Doctor
  appointmentId?: Types.ObjectId;  // ref Appointment, optional
  lineItems: IPrescriptionLineItem[];
  status: PrescriptionStatus;
  dispensedBy?: Types.ObjectId;    // ref User
  dispensedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LineItemSchema = new Schema<IPrescriptionLineItem>(
  {
    drugId: { type: Schema.Types.ObjectId, ref: 'Drug', required: true },
    drugName: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true },
    quantity: { type: Number, default: 1, min: 1 },
  },
  { _id: false }
);

const PrescriptionSchema = new Schema<IPrescription>(
  {
    prescriptionId: { type: String, unique: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
    lineItems: {
      type: [LineItemSchema],
      required: true,
      validate: {
        validator: (v: IPrescriptionLineItem[]) => v && v.length >= 1,
        message: 'Prescription must have at least one line item',
      },
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'dispensed', 'cancelled'],
      default: 'draft',
      index: true,
    },
    dispensedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    dispensedAt: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

PrescriptionSchema.index({ patientId: 1, status: 1 });

// Pre-save hook: auto-generate prescriptionId
PrescriptionSchema.pre('save', async function (next) {
  if (!this.prescriptionId) {
    const count = await (this.constructor as typeof Prescription).countDocuments();
    this.prescriptionId = `RX-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

export const Prescription = model<IPrescription>('Prescription', PrescriptionSchema);
