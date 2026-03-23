import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import * as PatientController from './controller';

const router = Router();

// Patient's own profile — patient role
router.get('/patients/me', authenticate, authorize('patients', 'read'), PatientController.getOwnProfile);
router.patch('/patients/me', authenticate, authorize('patients', 'write'), PatientController.updateOwnProfile);

// Admin/staff routes
router.get('/patients', authenticate, authorize('patients', 'read'), PatientController.listPatients);
router.post('/patients', authenticate, authorize('patients', 'write'), PatientController.createPatient);
router.get('/patients/:id', authenticate, authorize('patients', 'read'), PatientController.getPatient);
router.patch('/patients/:id', authenticate, authorize('patients', 'write'), PatientController.updatePatient);

export { router as patientRouter };
