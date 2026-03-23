import { Schema, model, Types } from 'mongoose';

export interface IPatient {
  _id: Types.ObjectId;
  userId: Types.ObjectId; // ref User
  patientId: string;      // PAT-XXXX auto-generated
  bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-';
  allergies: string[];
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  medicalHistory: Array<{
    condition: string;
    diagnosisDate?: Date;
    treatment?: string;
    notes?: string;
  }>;
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    expiryDate?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const PatientSchema = new Schema<IPatient>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    patientId: { type: String, unique: true, index: true },
    bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] },
    allergies: [{ type: String }],
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
    },
    medicalHistory: [{
      condition: { type: String, required: true },
      diagnosisDate: Date,
      treatment: String,
      notes: String,
    }],
    insuranceInfo: {
      provider: String,
      policyNumber: String,
      expiryDate: Date,
    },
  },
  { timestamps: true }
);

// Auto-generate patientId before save
// TODO: countDocuments-based ID generation is not race-condition safe under concurrent inserts.
// For a production multi-instance deployment, use an atomic counter collection or MongoDB sequence pattern.
PatientSchema.pre('save', async function (next) {
  if (!this.patientId) {
    const count = await (this.constructor as typeof Patient).countDocuments();
    this.patientId = `PAT-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

export const Patient = model<IPatient>('Patient', PatientSchema);
