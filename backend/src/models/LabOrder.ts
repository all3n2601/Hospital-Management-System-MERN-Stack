import { Schema, model, Types } from 'mongoose';

export interface ILabTest {
  name: string;
  code: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

export type LabOrderStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type LabOrderPriority = 'routine' | 'urgent' | 'stat';

export interface ILabOrder {
  _id: Types.ObjectId;
  orderId: string;              // auto-generated LAB-XXXX
  patient: Types.ObjectId;      // ref Patient, required, indexed
  doctor: Types.ObjectId;       // ref Doctor, required
  appointment?: Types.ObjectId; // ref Appointment, optional
  tests: ILabTest[];            // min 1 required
  priority: LabOrderPriority;   // default 'routine'
  status: LabOrderStatus;       // default 'pending'
  notes?: string;
  orderedAt: Date;              // default Date.now
  createdAt: Date;
  updatedAt: Date;
}

const LabTestSchema = new Schema<ILabTest>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
    },
  },
  { _id: false }
);

const LabOrderSchema = new Schema<ILabOrder>(
  {
    orderId: { type: String, unique: true },
    patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    doctor: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    appointment: { type: Schema.Types.ObjectId, ref: 'Appointment' },
    tests: {
      type: [LabTestSchema],
      required: true,
      validate: {
        validator: (v: ILabTest[]) => v && v.length >= 1,
        message: 'Lab order must have at least one test',
      },
    },
    priority: {
      type: String,
      enum: ['routine', 'urgent', 'stat'],
      default: 'routine',
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    notes: { type: String },
    orderedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound index for common query pattern
LabOrderSchema.index({ patient: 1, status: 1 });

// Pre-save hook: auto-generate orderId if not set
// TODO: countDocuments-based ID generation is not race-condition safe under concurrent inserts.
// For a production multi-instance deployment, use an atomic counter collection or MongoDB sequence pattern.
LabOrderSchema.pre('save', async function (next) {
  if (!this.orderId) {
    const count = await (this.constructor as typeof LabOrder).countDocuments();
    this.orderId = `LAB-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

export const LabOrder = model<ILabOrder>('LabOrder', LabOrderSchema);
