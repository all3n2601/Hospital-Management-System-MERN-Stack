import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import * as LabController from './controller';

const router = Router();

// Lab Orders
router.post('/orders', authenticate, authorize('lab', 'write'), LabController.createLabOrder);
router.get('/orders', authenticate, authorize('lab', 'read'), LabController.listLabOrders);
router.get('/orders/:id', authenticate, authorize('lab', 'read'), LabController.getLabOrderById);
router.patch('/orders/:id/status', authenticate, authorize('lab', 'write'), LabController.updateLabOrderStatus);

// Lab Results
router.post('/results', authenticate, authorize('lab', 'write'), LabController.createLabResult);
router.get('/results/:orderId', authenticate, authorize('lab', 'read'), LabController.getLabResultByOrderId);
router.patch('/results/:id/verify', authenticate, authorize('lab', 'write'), LabController.verifyLabResult);

export { router as labRouter };
