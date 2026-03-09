import { Router } from 'express';
import { presentationController } from '../controllers/presentationController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);
router.get('/', presentationController.list as any);
router.post('/', presentationController.create as any);
router.put('/:id', presentationController.update as any);

export default router;
