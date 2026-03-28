import { Router } from 'express';
import contactController from '../controllers/contact';
import { optionalAuth } from '../middlewares/auth';
import { contactValidation } from '../middlewares/validate';

const router = Router();

router.post(
  '/',
  optionalAuth,
  contactValidation.create,
  contactController.create.bind(contactController)
);

export default router;
