import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import * as DocumentController from './controller';

const router = Router();

// Create draft document (doctor/admin)
router.post(
  '/',
  authenticate,
  authorize('documents', 'issue'),
  DocumentController.createDocument
);

// List documents (own-read for patient, filtered for doctor, all for admin)
router.get(
  '/',
  authenticate,
  authorize('documents', 'read'),
  DocumentController.listDocuments
);

// Get single document
router.get(
  '/:id',
  authenticate,
  authorize('documents', 'read'),
  DocumentController.getDocumentById
);

// Issue document (doctor own or admin)
router.post(
  '/:id/issue',
  authenticate,
  authorize('documents', 'issue'),
  DocumentController.issueDocument
);

// Void document (doctor own or admin)
router.post(
  '/:id/void',
  authenticate,
  authorize('documents', 'void'),
  DocumentController.voidDocument
);

export { router as documentsRouter };
