import { Router } from 'express';
import messageController from '../controllers/messages';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.get('/:claimId', authenticate, messageController.getMessages.bind(messageController));
router.post('/:claimId', authenticate, messageController.sendMessage.bind(messageController));

export default router;
