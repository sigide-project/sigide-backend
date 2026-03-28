import { Router } from 'express';
import feedbackController from '../controllers/feedback';
import { optionalAuth } from '../middlewares/auth';
import { feedbackValidation } from '../middlewares/validate';

const router = Router();

router.post(
  '/',
  optionalAuth,
  feedbackValidation.create,
  feedbackController.create.bind(feedbackController)
);

export default router;
