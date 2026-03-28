import { Request, Response, NextFunction } from 'express';

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void | Response {
  const user = req.user;

  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  if (user.role === 'banned') {
    return res.status(403).json({
      success: false,
      error: 'Account has been banned',
    });
  }

  if (user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required',
    });
  }

  next();
}
