import { Schema, model, Types } from 'mongoose';

export interface IInventoryItem {
  _id: Types.ObjectId;
  itemId: string;
  name: string;
  code: string;
  category: string;
  quantity: number;
  unit: string;
  reorderLevel: number;
  expiryDate?: Date;
  supplier?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryItemSchema = new Schema<IInventoryItem>(
  {
    itemId: { type: String, unique: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true },
    category: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, default: 0, min: 0 },
    unit: { type: String, required: true, trim: true },
    reorderLevel: { type: Number, required: true, default: 0 },
    expiryDate: { type: Date },
    supplier: { type: String, trim: true },
    description: { type: String },
  },
  { timestamps: true }
);

InventoryItemSchema.pre('save', async function (next) {
  if (!this.itemId) {
    const count = await (this.constructor as typeof InventoryItem).countDocuments();
    this.itemId = `INV-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

export const InventoryItem = model<IInventoryItem>('InventoryItem', InventoryItemSchema);
