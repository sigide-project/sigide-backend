import { Request, Response } from 'express';
import { z } from 'zod';
import {
  signToken,
  findUserByEmail,
  createUser,
  authenticateUser,
  formatUserResponse,
} from '../services/auth';

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().max(20).optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export async function register(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const validationResult = registerSchema.safeParse(req.body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    const { name, email, password, phone } = validationResult.data;

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists',
      });
    }

    const user = await createUser({
      name,
      email,
      password,
      phone,
    });

    const token = signToken(user);

    return res.status(201).json({
      success: true,
      user: formatUserResponse(user),
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Registration failed',
    });
  }
}

export async function login(req: Request, res: Response): Promise<Response> {
  try {
    const validationResult = loginSchema.safeParse(req.body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    const { email, password } = validationResult.data;

    const user = await authenticateUser(email, password);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (user.isActive === false) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated',
      });
    }

    const token = signToken(user);

    return res.status(200).json({
      success: true,
      user: formatUserResponse(user),
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Login failed',
    });
  }
}

export function googleCallback(req: Request, res: Response): void {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
console.log("req.user",req.user);
  if (!req.user) {
    res.redirect(`${frontendUrl}/login?error=google_failed`);
    return;
  }

  const user = req.user;
  const token = signToken(user);

  res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
}
