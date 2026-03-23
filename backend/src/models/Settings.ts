import { Schema, model, Model } from 'mongoose';

export interface ISettings {
  hospitalName: string;
  address?: string;
  logoUrl?: string;
  defaultTaxRate: number;
  workingHours?: {
    start: string;
    end: string;
  };
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ISettingsModel extends Model<ISettings> {
  getSingleton(): Promise<ISettings & { _id: unknown }>;
}

const SettingsSchema = new Schema<ISettings>(
  {
    hospitalName: { type: String, default: 'MediCore HMS' },
    address: { type: String },
    logoUrl: { type: String },
    defaultTaxRate: {
      type: Number,
      default: 0,
      min: [0, 'Tax rate cannot be negative'],
      max: [100, 'Tax rate cannot exceed 100'],
    },
    workingHours: {
      type: new Schema(
        {
          start: { type: String, required: true },
          end: { type: String, required: true },
        },
        { _id: false }
      ),
    },
    timezone: { type: String, default: 'UTC' },
  },
  { timestamps: true }
);

SettingsSchema.statics.getSingleton = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

export const Settings = model<ISettings, ISettingsModel>('Settings', SettingsSchema);
