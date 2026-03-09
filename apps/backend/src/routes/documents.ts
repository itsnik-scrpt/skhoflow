import { Router } from 'express';
import { documentController } from '../controllers/documentController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);
router.get('/', documentController.list as any);
router.post('/', documentController.create as any);
router.get('/:id', documentController.get as any);
router.put('/:id', documentController.update as any);
router.delete('/:id', documentController.delete as any);

export default router;
