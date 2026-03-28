import { Router } from 'express';
import reportsController from '../controllers/reports';
import { optionalAuth } from '../middlewares/auth';
import { reportsValidation } from '../middlewares/validate';

const router = Router();

router.post(
  '/',
  optionalAuth,
  reportsValidation.create,
  reportsController.create.bind(reportsController)
);

export default router;
