import { Notification } from '../models';
import { getIO } from '../socket';

interface CreateNotificationInput {
  user_id: string;
  type: string;
  payload: Record<string, unknown>;
}

class NotificationService {
  async createNotification(data: CreateNotificationInput): Promise<Notification> {
    const notification = await Notification.create(data);

    try {
      const io = getIO();
      const notificationPayload = {
        id: notification.id,
        type: notification.type,
        payload: notification.payload,
        read: notification.read,
        created_at: notification.createdAt,
      };
      console.log(`[socket] Emitting new_notification to user:${data.user_id}`, notificationPayload.id);
      io.to(`user:${data.user_id}`).emit('new_notification', notificationPayload);
    } catch (error) {
      console.warn('[socket] Socket.io not initialized, skipping notification emit', error);
    }

    return notification;
  }

  async getNotifications(userId: string): Promise<{ notifications: Notification[]; unread_count: number }> {
    const notifications = await Notification.findAll({
      where: { user_id: userId },
      order: [['createdAt', 'DESC']],
      limit: 30,
    });

    const unread_count = await Notification.count({
      where: { user_id: userId, read: false },
    });

    return { notifications, unread_count };
  }

  async markAllRead(userId: string): Promise<number> {
    const [updated] = await Notification.update(
      { read: true },
      { where: { user_id: userId, read: false } }
    );
    return updated;
  }

  async markOneRead(notificationId: string, userId: string): Promise<Notification | null> {
    const notification = await Notification.findOne({
      where: { id: notificationId, user_id: userId },
    });

    if (!notification) return null;

    notification.read = true;
    await notification.save();
    return notification;
  }
}

export default new NotificationService();
