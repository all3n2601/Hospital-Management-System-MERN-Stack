import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import * as InventoryController from './controller';

const router = Router();

// Item routes
router.post('/items', authenticate, authorize('inventory', 'write'), InventoryController.createItem);
router.get('/items', authenticate, authorize('inventory', 'read'), InventoryController.listItems);
router.get('/items/:id', authenticate, authorize('inventory', 'read'), InventoryController.getItemById);
router.patch('/items/:id', authenticate, authorize('inventory', 'write'), InventoryController.updateItem);

// Stock adjustment
router.post('/items/:id/stock', authenticate, authorize('inventory', 'write'), InventoryController.adjustStock);

// Movement routes
router.get('/items/:id/movements', authenticate, authorize('inventory', 'write'), InventoryController.listItemMovements);
router.get('/movements', authenticate, authorize('inventory', 'write'), InventoryController.listAllMovements);

export { router as inventoryRouter };
