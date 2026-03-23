import { Router } from 'express';
import { authRouter } from '../modules/auth/router';

const router = Router();
router.use('/auth', authRouter);

export { router };
