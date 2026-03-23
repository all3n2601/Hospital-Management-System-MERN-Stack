import { Schema, model, Types } from 'mongoose';

export interface IReceptionist {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  receptionistId: string; // REC-XXXX
  department?: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReceptionistSchema = new Schema<IReceptionist>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    receptionistId: { type: String, unique: true, index: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department' },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

// TODO: countDocuments-based ID generation is not race-condition safe under concurrent inserts.
// For a production multi-instance deployment, use an atomic counter collection or MongoDB sequence pattern.
ReceptionistSchema.pre('save', async function (next) {
  if (!this.receptionistId) {
    const count = await (this.constructor as typeof Receptionist).countDocuments();
    this.receptionistId = `REC-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

export const Receptionist = model<IReceptionist>('Receptionist', ReceptionistSchema);
