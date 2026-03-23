import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import * as BillingController from './controller';

const router = Router();

// Create invoice
router.post('/', authenticate, authorize('billing', 'write'), BillingController.createInvoice);

// List invoices
router.get('/', authenticate, authorize('billing', 'read'), BillingController.listInvoices);

// Get single invoice
router.get('/:id', authenticate, authorize('billing', 'read'), BillingController.getInvoice);

// Issue invoice
router.patch('/:id/issue', authenticate, authorize('billing', 'issue'), BillingController.issueInvoice);

// Record payment
router.post('/:id/payments', authenticate, authorize('billing', 'write'), BillingController.recordPayment);

// Void invoice
router.patch('/:id/void', authenticate, authorize('billing', 'void'), BillingController.voidInvoice);

export { router as billingRouter };
