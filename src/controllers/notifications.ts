import { Request, Response } from 'express';
import notificationService from '../services/notifications';
import { AuthenticatedUser } from '../types';

class NotificationController {
  async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as AuthenticatedUser;
      const result = await notificationService.getNotifications(user.id);
      res.json({
        success: true,
        notifications: result.notifications,
        unread_count: result.unread_count,
      });
    } catch (error) {
      const err = error as Error;
      console.error('Error fetching notifications:', err);
      res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
    }
  }

  async markAllRead(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as AuthenticatedUser;
      const updated = await notificationService.markAllRead(user.id);
      res.json({ success: true, updated });
    } catch (error) {
      const err = error as Error;
      console.error('Error marking notifications as read:', err);
      res.status(500).json({ success: false, message: 'Failed to mark notifications as read' });
    }
  }

  async markOneRead(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as AuthenticatedUser;
      const id = req.params.id as string;
      const notification = await notificationService.markOneRead(id, user.id);

      if (!notification) {
        res.status(404).json({ success: false, message: 'Notification not found' });
        return;
      }

      res.json({ success: true, notification });
    } catch (error) {
      const err = error as Error;
      console.error('Error marking notification as read:', err);
      res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
    }
  }
}

export default new NotificationController();
