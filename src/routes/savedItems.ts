import { Router } from 'express';
import savedItemsController from '../controllers/savedItems';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/', savedItemsController.getSavedItems.bind(savedItemsController));

router.get('/ids', savedItemsController.getSavedItemIds.bind(savedItemsController));

router.get('/:itemId/check', savedItemsController.checkSaved.bind(savedItemsController));

router.post('/:itemId', savedItemsController.saveItem.bind(savedItemsController));

router.delete('/:itemId', savedItemsController.unsaveItem.bind(savedItemsController));

export default router;
