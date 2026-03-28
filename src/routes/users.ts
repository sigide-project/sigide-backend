import { Router } from 'express';
import usersController from '../controllers/users';
import { authenticate } from '../middlewares/auth';
import { userValidation } from '../middlewares/validate';

const router = Router();

router.get('/me', authenticate, usersController.getMe.bind(usersController));

router.patch(
  '/me',
  authenticate,
  userValidation.updateMe,
  usersController.updateMe.bind(usersController)
);

router.post(
  '/me/change-password',
  authenticate,
  userValidation.changePassword,
  usersController.changePassword.bind(usersController)
);

router.get(
  '/me/has-password',
  authenticate,
  usersController.hasPassword.bind(usersController)
);

router.post(
  '/me/set-password',
  authenticate,
  userValidation.setPassword,
  usersController.setPassword.bind(usersController)
);

router.get(
  '/check-username/:username',
  authenticate,
  userValidation.usernameParam,
  usersController.checkUsernameAvailability.bind(usersController)
);

router.get(
  '/profile/:username',
  authenticate,
  userValidation.usernameParam,
  usersController.getPublicProfile.bind(usersController)
);

router.delete(
  '/me',
  authenticate,
  usersController.deleteAccount.bind(usersController)
);

export default router;
