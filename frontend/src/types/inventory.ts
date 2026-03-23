export type MovementType = 'in' | 'out' | 'adjustment' | 'waste';

export interface InventoryItem {
  _id: string;
  itemId: string;
  name: string;
  code: string;
  category: string;
  quantity: number;
  unit: string;
  reorderLevel: number;
  expiryDate?: string;
  supplier?: string;
  description?: string;
  createdAt: string;
}

export interface StockMovement {
  _id: string;
  itemId: string | InventoryItem;
  type: MovementType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason?: string;
  performedBy: { _id: string; firstName: string; lastName: string } | null;
  createdAt: string;
}
