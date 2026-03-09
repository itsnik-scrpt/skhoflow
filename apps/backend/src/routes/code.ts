import { Router } from 'express';
import { codeController } from '../controllers/codeController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);
router.post('/execute', codeController.execute as any);

export default router;
