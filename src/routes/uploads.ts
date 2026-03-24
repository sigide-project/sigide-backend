import { Router } from 'express';
import uploadsController from '../controllers/uploads';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post(
  '/',
  authenticate,
  uploadsController.handleUpload.bind(uploadsController),
  uploadsController.upload.bind(uploadsController)
);

router.delete(
  '/',
  authenticate,
  uploadsController.delete.bind(uploadsController)
);

export default router;
