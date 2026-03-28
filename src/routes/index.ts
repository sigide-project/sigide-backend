import { Router, Request, Response } from 'express';
import itemRoutes from './items';
import authRoutes from './auth';
import usersRoutes from './users';
import uploadsRoutes from './uploads';
import addressesRoutes from './addresses';
import savedItemsRoutes from './savedItems';
import claimsRoutes from './claims';
import messagesRoutes from './messages';
import notificationsRoutes from './notifications';
import contactRoutes from './contact';
import reportsRoutes from './reports';
import feedbackRoutes from './feedback';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/items', itemRoutes);
router.use('/users', usersRoutes);
router.use('/uploads', uploadsRoutes);
router.use('/addresses', addressesRoutes);
router.use('/saved-items', savedItemsRoutes);
router.use('/claims', claimsRoutes);
router.use('/messages', messagesRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/contact', contactRoutes);
router.use('/reports', reportsRoutes);
router.use('/feedback', feedbackRoutes);

export default router;
