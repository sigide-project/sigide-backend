import { User } from '../models/User';
import { Item } from '../models/Item';

class StatsService {
  async getPublicStats() {
    const [totalUsers, totalItems] = await Promise.all([
      User.count({ where: { isActive: true, isDeleted: false } }),
      Item.count(),
    ]);

    return { totalUsers, totalItems };
  }
}

export default new StatsService();
