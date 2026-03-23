import { Router } from 'express';
import { authRouter } from '../modules/auth/router';
import { staffRouter } from '../modules/staff/router';
import { patientRouter } from '../modules/patients/router';
import { appointmentRouter } from '../modules/appointments/router';
import { billingRouter } from '../modules/billing/router';

const router = Router();
router.use('/auth', authRouter);
router.use('/', staffRouter);
router.use('/', patientRouter);
router.use('/appointments', appointmentRouter);
router.use('/billing', billingRouter);

export { router };
