import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import * as PharmacyController from './controller';

const router = Router();

// Drug routes
router.post('/drugs', authenticate, authorize('drugs', 'write'), PharmacyController.createDrug);
router.get('/drugs', authenticate, authorize('drugs', 'read'), PharmacyController.listDrugs);
router.get('/drugs/:id', authenticate, authorize('drugs', 'read'), PharmacyController.getDrugById);
router.patch('/drugs/:id', authenticate, authorize('drugs', 'write'), PharmacyController.updateDrug);

// Prescription routes
router.post(
  '/prescriptions',
  authenticate,
  authorize('prescriptions', 'write'),
  PharmacyController.createPrescription
);
router.get(
  '/prescriptions',
  authenticate,
  authorize('prescriptions', 'read'),
  PharmacyController.listPrescriptions
);
router.get(
  '/prescriptions/:id',
  authenticate,
  authorize('prescriptions', 'read'),
  PharmacyController.getPrescriptionById
);
router.patch(
  '/prescriptions/:id/activate',
  authenticate,
  authorize('prescriptions', 'write'),
  PharmacyController.activatePrescription
);
router.patch(
  '/prescriptions/:id/dispense',
  authenticate,
  authorize('prescriptions', 'dispense'),
  PharmacyController.dispensePrescription
);
router.patch(
  '/prescriptions/:id/cancel',
  authenticate,
  authorize('prescriptions', 'write'),
  PharmacyController.cancelPrescription
);

export { router as pharmacyRouter };
