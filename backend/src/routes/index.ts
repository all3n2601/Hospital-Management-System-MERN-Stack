import { Router } from 'express';
import { authRouter } from '../modules/auth/router';
import { staffRouter } from '../modules/staff/router';
import { patientRouter } from '../modules/patients/router';
import { appointmentRouter } from '../modules/appointments/router';
import { billingRouter } from '../modules/billing/router';
import { labRouter } from '../modules/lab/router';
import { pharmacyRouter } from '../modules/pharmacy/router';

const router = Router();
router.use('/auth', authRouter);
router.use('/', staffRouter);
router.use('/', patientRouter);
router.use('/appointments', appointmentRouter);
router.use('/billing', billingRouter);
router.use('/lab', labRouter);
router.use('/pharmacy', pharmacyRouter);

export { router };
