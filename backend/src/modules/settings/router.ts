import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import * as SettingsController from './controller';

const router = Router();

router.get('/', authenticate, authorize('settings', 'read'), SettingsController.getSettings);
router.patch('/', authenticate, authorize('settings', 'write'), SettingsController.updateSettings);

export { router as settingsRouter };
