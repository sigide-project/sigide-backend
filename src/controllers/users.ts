import { Request, Response } from 'express';
import usersService, { UpdateMeInput, ChangePasswordInput } from '../services/users';

class UsersController {
  async getMe(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const user = await usersService.getById(userId);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          phone: user.phone,
          avatar_url: user.avatar_url,
          role: user.role,
          rating: user.rating,
          address: user.address,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    } catch (error) {
      const err = error as Error;
      console.error('Error fetching user profile:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch profile',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      });
    }
  }

  async getPublicProfile(req: Request, res: Response): Promise<void> {
    try {
      const username = req.params.username as string;
      const profile = await usersService.getPublicProfile(username);

      if (!profile) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      res.json({
        success: true,
        user: profile,
      });
    } catch (error) {
      const err = error as Error;
      console.error('Error fetching public profile:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch profile',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      });
    }
  }

  async checkUsernameAvailability(req: Request, res: Response): Promise<void> {
    try {
      const username = req.params.username as string;
      const userId = req.user?.id;
      const isAvailable = await usersService.isUsernameAvailable(username, userId);

      res.json({
        success: true,
        available: isAvailable,
      });
    } catch (error) {
      const err = error as Error;
      console.error('Error checking username availability:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to check username availability',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      });
    }
  }

  async updateMe(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const { name, phone, avatar_url, username, address } = req.body;
      const updateData: UpdateMeInput = {};

      if (name !== undefined) updateData.name = name;
      if (phone !== undefined) updateData.phone = phone;
      if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
      if (address !== undefined) updateData.address = address;
      
      if (username !== undefined) {
        const isAvailable = await usersService.isUsernameAvailable(username, userId);
        if (!isAvailable) {
          res.status(400).json({
            success: false,
            message: 'Username is already taken',
          });
          return;
        }
        updateData.username = username;
      }

      const user = await usersService.updateMe(userId, updateData);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      res.json({ user });
    } catch (error) {
      const err = error as Error;
      console.error('Error updating user profile:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      });
    }
  }

  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { currentPassword, newPassword } = req.body;

      const data: ChangePasswordInput = {
        currentPassword,
        newPassword,
      };

      const result = await usersService.changePassword(userId, data);

      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.message,
        });
        return;
      }

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      const err = error as Error;
      console.error('Error changing password:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to change password',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      });
    }
  }

  async hasPassword(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const hasPassword = await usersService.hasPassword(userId);

      res.json({
        success: true,
        hasPassword,
      });
    } catch (error) {
      const err = error as Error;
      console.error('Error checking password status:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to check password status',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      });
    }
  }

  async setPassword(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { newPassword } = req.body;

      const result = await usersService.setPassword(userId, newPassword);

      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.message,
        });
        return;
      }

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      const err = error as Error;
      console.error('Error setting password:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to set password',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      });
    }
  }

  async deleteAccount(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await usersService.deleteAccount(userId);

      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.message,
        });
        return;
      }

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      const err = error as Error;
      console.error('Error deleting account:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to delete account',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      });
    }
  }
}

export default new UsersController();
