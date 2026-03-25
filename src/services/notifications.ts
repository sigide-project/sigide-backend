import { Notification } from '../models';

interface CreateNotificationInput {
  user_id: string;
  type: string;
  payload: Record<string, unknown>;
}

class NotificationService {
  async createNotification(data: CreateNotificationInput): Promise<Notification> {
    return Notification.create(data);
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
