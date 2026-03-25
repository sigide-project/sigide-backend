import { Router } from 'express';
import claimController from '../controllers/claims';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/', authenticate, claimController.create.bind(claimController));
router.get('/mine', authenticate, claimController.getMyClaims.bind(claimController));
router.get('/on-my-items', authenticate, claimController.getClaimsOnMyItems.bind(claimController));
router.get('/:id', authenticate, claimController.getById.bind(claimController));
router.patch('/:id/accept', authenticate, claimController.accept.bind(claimController));
router.patch('/:id/reject', authenticate, claimController.reject.bind(claimController));
router.patch('/:id/resolve', authenticate, claimController.resolve.bind(claimController));

export default router;
