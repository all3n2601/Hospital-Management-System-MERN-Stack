import { Types } from 'mongoose';
import { z } from 'zod';
import { InventoryItem } from '../../models/InventoryItem';
import { StockMovement } from '../../models/StockMovement';
import { NotFoundError, ValidationError } from '../../middleware/errorHandler';
import { emitToRole } from '../../socket';
import {
  CreateInventoryItemSchema,
  UpdateInventoryItemSchema,
  AdjustStockSchema,
  ListInventoryQuerySchema,
  ListMovementsQuerySchema,
} from './schema';

type CreateInventoryItemInput = z.infer<typeof CreateInventoryItemSchema>;
type UpdateInventoryItemInput = z.infer<typeof UpdateInventoryItemSchema>;
type AdjustStockInput = z.infer<typeof AdjustStockSchema>;
type ListInventoryQuery = z.infer<typeof ListInventoryQuerySchema>;
type ListMovementsQuery = z.infer<typeof ListMovementsQuerySchema>;

// ---------------------------------------------------------------------------
// Item services
// ---------------------------------------------------------------------------

export async function createItem(input: CreateInventoryItemInput) {
  const item = await InventoryItem.create({
    name: input.name,
    code: input.code,
    category: input.category,
    quantity: input.quantity ?? 0,
    unit: input.unit,
    reorderLevel: input.reorderLevel ?? 0,
    expiryDate: input.expiryDate,
    supplier: input.supplier,
    description: input.description,
  });
  return item;
}

export async function listItems(query: ListInventoryQuery) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;
  const filter: Record<string, unknown> = {};

  if (query.category) {
    filter.category = new RegExp(query.category, 'i');
  }

  if (query.search) {
    const regex = new RegExp(query.search, 'i');
    filter.$or = [{ name: regex }, { code: regex }, { category: regex }];
  }

  if (query.lowStock === true) {
    filter.$expr = { $lte: ['$quantity', '$reorderLevel'] };
  }

  const [data, total] = await Promise.all([
    InventoryItem.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
    InventoryItem.countDocuments(filter),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getItemById(id: string) {
  const item = await InventoryItem.findById(id);
  if (!item) throw new NotFoundError('InventoryItem');
  return item;
}

export async function updateItem(id: string, input: UpdateInventoryItemInput) {
  const item = await InventoryItem.findByIdAndUpdate(
    id,
    { $set: input },
    { new: true, runValidators: true }
  );
  if (!item) throw new NotFoundError('InventoryItem');
  return item;
}

// ---------------------------------------------------------------------------
// Stock adjustment
// ---------------------------------------------------------------------------

export async function adjustStock(
  id: string,
  input: AdjustStockInput,
  performedBy: string
) {
  const item = await InventoryItem.findById(id);
  if (!item) throw new NotFoundError('InventoryItem');

  const previousQuantity = item.quantity;
  let newQuantity: number;

  switch (input.type) {
    case 'in':
      newQuantity = previousQuantity + input.quantity;
      break;
    case 'out':
    case 'waste':
      newQuantity = previousQuantity - input.quantity;
      if (newQuantity < 0) {
        throw new ValidationError(
          `Insufficient quantity. Available: ${previousQuantity}, requested: ${input.quantity}`
        );
      }
      break;
    case 'adjustment':
      // Absolute set
      newQuantity = input.quantity;
      break;
    default:
      throw new ValidationError('Invalid movement type');
  }

  item.quantity = newQuantity;
  await item.save();

  // Record stock movement
  const movement = await StockMovement.create({
    itemId: new Types.ObjectId(id),
    type: input.type,
    quantity: input.quantity,
    previousQuantity,
    newQuantity,
    reason: input.reason,
    performedBy: new Types.ObjectId(performedBy),
  });

  // Emit low-stock alert if at or below reorder level
  if (newQuantity <= item.reorderLevel) {
    emitToRole('admin', 'inventory:low-stock', {
      itemId: item._id.toString(),
      itemName: item.name,
      currentQuantity: newQuantity,
      reorderLevel: item.reorderLevel,
    });
  }

  return { item, movement };
}

// ---------------------------------------------------------------------------
// Movement services
// ---------------------------------------------------------------------------

export async function listItemMovements(itemId: string, query: ListMovementsQuery) {
  // Verify item exists
  const item = await InventoryItem.findById(itemId);
  if (!item) throw new NotFoundError('InventoryItem');

  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    StockMovement.find({ itemId: new Types.ObjectId(itemId) })
      .populate('performedBy', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    StockMovement.countDocuments({ itemId: new Types.ObjectId(itemId) }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function listAllMovements(query: ListMovementsQuery) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    StockMovement.find()
      .populate('itemId', 'name code category')
      .populate('performedBy', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    StockMovement.countDocuments(),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}
