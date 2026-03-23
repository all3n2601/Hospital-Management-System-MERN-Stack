import { Schema, model, Types } from 'mongoose';

export type StockMovementType = 'in' | 'out' | 'adjustment' | 'waste';

export interface IStockMovement {
  _id: Types.ObjectId;
  itemId: Types.ObjectId;
  type: StockMovementType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason?: string;
  performedBy: Types.ObjectId;
  createdAt: Date;
}

const StockMovementSchema = new Schema<IStockMovement>(
  {
    itemId: { type: Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
    type: { type: String, enum: ['in', 'out', 'adjustment', 'waste'], required: true },
    quantity: { type: Number, required: true, min: 1 },
    previousQuantity: { type: Number, required: true },
    newQuantity: { type: Number, required: true },
    reason: { type: String },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const StockMovement = model<IStockMovement>('StockMovement', StockMovementSchema);
