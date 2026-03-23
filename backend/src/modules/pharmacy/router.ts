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
// Nurses have 'dispense' permission (not 'read'), so they get their own listing route
// that accepts the dispense action. Admin/doctor/patient use the read-based listing.
router.get(
  '/prescriptions',
  authenticate,
  (req, res, next) => {
    const role = req.user?.role;
    if (role === 'nurse') {
      // Use dispense permission for nurse
      return authorize('prescriptions', 'dispense')(req, res, next);
    }
    return authorize('prescriptions', 'read')(req, res, next);
  },
  PharmacyController.listPrescriptions
);
router.get(
  '/prescriptions/:id',
  authenticate,
  (req, res, next) => {
    const role = req.user?.role;
    if (role === 'nurse') {
      return authorize('prescriptions', 'dispense')(req, res, next);
    }
    return authorize('prescriptions', 'read')(req, res, next);
  },
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
