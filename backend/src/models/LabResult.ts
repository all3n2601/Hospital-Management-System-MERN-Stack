import { Schema, model, Types } from 'mongoose';

export interface ILabResultItem {
  testCode: string;
  testName: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  isNormal?: boolean;
}

export interface ILabResult {
  _id: Types.ObjectId;
  labOrder: Types.ObjectId;     // ref LabOrder, required, unique (1 result per order)
  patient: Types.ObjectId;      // ref Patient, required, indexed
  results: ILabResultItem[];    // array of individual test results
  technician: Types.ObjectId;   // ref User, required (who ran the tests)
  verifiedBy?: Types.ObjectId;  // ref Doctor (who verified)
  reportUrl?: string;           // S3 URL placeholder
  notes?: string;
  collectedAt?: Date;
  resultedAt?: Date;            // when results were entered
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LabResultItemSchema = new Schema<ILabResultItem>(
  {
    testCode: { type: String, required: true },
    testName: { type: String, required: true },
    value: { type: String, required: true },
    unit: { type: String },
    referenceRange: { type: String },
    isNormal: { type: Boolean },
  },
  { _id: false }
);

const LabResultSchema = new Schema<ILabResult>(
  {
    labOrder: { type: Schema.Types.ObjectId, ref: 'LabOrder', required: true, unique: true },
    patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    results: { type: [LabResultItemSchema], default: [] },
    technician: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'Doctor' },
    reportUrl: { type: String },
    notes: { type: String },
    collectedAt: { type: Date },
    resultedAt: { type: Date },
    verifiedAt: { type: Date },
  },
  { timestamps: true }
);

export const LabResult = model<ILabResult>('LabResult', LabResultSchema);
