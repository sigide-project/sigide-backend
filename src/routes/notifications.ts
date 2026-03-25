import { Router } from 'express';
import notificationController from '../controllers/notifications';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.get('/', authenticate, notificationController.getNotifications.bind(notificationController));
router.patch('/read-all', authenticate, notificationController.markAllRead.bind(notificationController));
router.patch('/:id/read', authenticate, notificationController.markOneRead.bind(notificationController));

export default router;
