import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import * as StaffController from './controller';

const router = Router();

// ─── Staff routes (admin only) ──────────────────────────────────────────────
router.get('/staff', authenticate, authorize('users', 'read'), StaffController.listStaff);
router.post('/staff', authenticate, authorize('users', 'write'), StaffController.createStaff);
router.get('/staff/:id', authenticate, authorize('users', 'read'), StaffController.getStaff);
router.patch('/staff/:id', authenticate, authorize('users', 'write'), StaffController.updateStaff);
router.delete('/staff/:id', authenticate, authorize('users', 'write'), StaffController.deactivateStaff);

// ─── Doctor routes (all authenticated) ─────────────────────────────────────
router.get('/doctors', authenticate, authorize('patients', 'read'), StaffController.listDoctors);
// NOTE: /doctors/available must be defined BEFORE /doctors/:id to avoid param capture
router.get('/doctors/available', authenticate, authorize('patients', 'read'), StaffController.getAvailableDoctors);
router.get('/doctors/:id', authenticate, authorize('patients', 'read'), StaffController.getDoctorProfile);

// ─── Department routes ──────────────────────────────────────────────────────
router.get('/departments', authenticate, authorize('patients', 'read'), StaffController.listDepartments);
router.post('/departments', authenticate, authorize('users', 'write'), StaffController.createDepartment);
router.patch('/departments/:id', authenticate, authorize('users', 'write'), StaffController.updateDepartment);

export { router as staffRouter };
