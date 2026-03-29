import { Router } from 'express';
import statsController from '../controllers/stats';

const router = Router();

router.get('/', statsController.getPublicStats.bind(statsController));

export default router;
