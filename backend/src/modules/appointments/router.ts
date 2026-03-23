import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import * as AppointmentController from './controller';

const router = Router();

// GET /slots must come before /:id to avoid route conflicts
router.get('/slots', authenticate, authorize('appointments', 'read'), AppointmentController.getAvailableSlots);

// Book appointment (all authenticated)
router.post('/', authenticate, authorize('appointments', 'write'), AppointmentController.bookAppointment);

// List appointments (all authenticated, filtered by role at service level)
router.get('/', authenticate, authorize('appointments', 'read'), AppointmentController.listAppointments);

// Get single appointment
router.get('/:id', authenticate, authorize('appointments', 'read'), AppointmentController.getAppointment);

// Update appointment status (role-based)
router.patch('/:id/status', authenticate, authorize('appointments', 'write'), AppointmentController.updateAppointmentStatus);

// Cancel appointment
router.delete('/:id', authenticate, authorize('appointments', 'write'), AppointmentController.cancelAppointment);

export { router as appointmentRouter };
