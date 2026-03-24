import { Router, Request, Response } from 'express';
import passport from 'passport';
import * as authController from '../controllers/auth';

const router = Router();

router.post('/register', authController.register);

router.post('/login', authController.login);

router.get(
  '/google',
  passport.authenticate('google', {
    session: false,
    scope: ['profile', 'email'],
  })
);

router.get(
  '/google/callback',
  (req: Request, res: Response, next) => {
    passport.authenticate('google', { session: false }, (err: Error | null, user: unknown, info: unknown) => {
      if (err) {
        console.error('Google OAuth authentication error:', err);
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=google_failed&reason=auth_error`);
      }
      if (!user) {
        console.error('Google OAuth no user returned. Info:', info);
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=google_failed&reason=no_user`);
      }
      req.user = user as Request['user'];
      next();
    })(req, res, next);
  },
  authController.googleCallback
);

router.get('/me', (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated',
    });
  }
  return res.json({
    success: true,
    user: req.user,
  });
});

export default router;
