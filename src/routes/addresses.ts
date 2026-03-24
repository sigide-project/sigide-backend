import { Router } from 'express';
import addressesController from '../controllers/addresses';
import { authenticate } from '../middlewares/auth';
import { addressValidation } from '../middlewares/validate';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /addresses - Get all addresses for the current user
router.get('/', addressesController.getAll.bind(addressesController));

// GET /addresses/:id - Get a specific address
router.get(
  '/:id',
  addressValidation.idParam,
  addressesController.getOne.bind(addressesController)
);

// POST /addresses - Create a new address
router.post(
  '/',
  addressValidation.create,
  addressesController.create.bind(addressesController)
);

// PATCH /addresses/:id - Update an address
router.patch(
  '/:id',
  addressValidation.idParam,
  addressValidation.update,
  addressesController.update.bind(addressesController)
);

// DELETE /addresses/:id - Delete an address
router.delete(
  '/:id',
  addressValidation.idParam,
  addressesController.delete.bind(addressesController)
);

// POST /addresses/:id/default - Set an address as default
router.post(
  '/:id/default',
  addressValidation.idParam,
  addressesController.setDefault.bind(addressesController)
);

export default router;
