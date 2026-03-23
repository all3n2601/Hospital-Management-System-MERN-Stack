import { Router } from 'express';
import { authRouter } from '../modules/auth/router';
import { staffRouter } from '../modules/staff/router';
import { patientRouter } from '../modules/patients/router';

const router = Router();
router.use('/auth', authRouter);
router.use('/', staffRouter);
router.use('/', patientRouter);

export { router };
