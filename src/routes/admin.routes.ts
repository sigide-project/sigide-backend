import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { requireAdmin } from '../middlewares/adminAuth.middleware';
import { getStats } from '../controllers/admin/stats.controller';
import {
  getUsers,
  getUserById,
  banUser,
  unbanUser,
  makeAdmin,
} from '../controllers/admin/users.controller';
import {
  getItems,
  getItemById,
  updateItemStatus,
  deleteItem,
} from '../controllers/admin/items.controller';
import {
  getClaims,
  getClaimById,
  updateClaimStatus,
} from '../controllers/admin/claims.controller';
import {
  getReports,
  getReportById,
  updateReportStatus,
} from '../controllers/admin/reports.controller';
import { getFeedback } from '../controllers/admin/feedback.controller';
import { getContact } from '../controllers/admin/contact.controller';
import { getAnalytics } from '../controllers/admin/analytics.controller';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

router.get('/', getStats);

router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.patch('/users/:id/ban', banUser);
router.patch('/users/:id/unban', unbanUser);
router.patch('/users/:id/make-admin', makeAdmin);

router.get('/items', getItems);
router.get('/items/:id', getItemById);
router.patch('/items/:id/status', updateItemStatus);
router.delete('/items/:id', deleteItem);

router.get('/claims', getClaims);
router.get('/claims/:id', getClaimById);
router.patch('/claims/:id/status', updateClaimStatus);

router.get('/reports', getReports);
router.get('/reports/:id', getReportById);
router.patch('/reports/:id/status', updateReportStatus);

router.get('/feedback', getFeedback);

router.get('/contact', getContact);

router.get('/analytics', getAnalytics);

export default router;
