import { SavedItem, Item, User } from '../models';
import { PaginationInfo } from '../types';

interface SavedItemsListResult {
  items: Item[];
  pagination: PaginationInfo;
}

const ITEM_ATTRIBUTES = [
  'id',
  'user_id',
  'type',
  'status',
  'title',
  'description',
  'category',
  'image_urls',
  'location_name',
  'reward_amount',
  'lost_found_at',
  'createdAt',
  'updatedAt',
];

class SavedItemsService {
  async saveItem(userId: string, itemId: string): Promise<{ savedItem: SavedItem | null; alreadySaved: boolean; itemNotFound: boolean }> {
    const item = await Item.findByPk(itemId);
    if (!item) {
      return { savedItem: null, alreadySaved: false, itemNotFound: true };
    }

    const existing = await SavedItem.findOne({
      where: { user_id: userId, item_id: itemId },
    });

    if (existing) {
      return { savedItem: existing, alreadySaved: true, itemNotFound: false };
    }

    const savedItem = await SavedItem.create({
      user_id: userId,
      item_id: itemId,
    });

    return { savedItem, alreadySaved: false, itemNotFound: false };
  }

  async unsaveItem(userId: string, itemId: string): Promise<{ success: boolean; notFound: boolean }> {
    const savedItem = await SavedItem.findOne({
      where: { user_id: userId, item_id: itemId },
    });

    if (!savedItem) {
      return { success: false, notFound: true };
    }

    await savedItem.destroy();
    return { success: true, notFound: false };
  }

  async isItemSaved(userId: string, itemId: string): Promise<boolean> {
    const savedItem = await SavedItem.findOne({
      where: { user_id: userId, item_id: itemId },
    });
    return !!savedItem;
  }

  async getSavedItems(userId: string, page = 1, limit = 20): Promise<SavedItemsListResult> {
    const offset = (page - 1) * limit;

    const { rows: savedItems, count: total } = await SavedItem.findAndCountAll({
      where: { user_id: userId },
      include: [
        {
          model: Item,
          as: 'item',
          attributes: ITEM_ATTRIBUTES,
          include: [
            {
              model: User,
              as: 'owner',
              attributes: ['id', 'username', 'name', 'avatar_url'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    const items = savedItems
      .map((si) => si.item)
      .filter((item): item is Item => item !== undefined);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSavedItemIds(userId: string): Promise<string[]> {
    const savedItems = await SavedItem.findAll({
      where: { user_id: userId },
      attributes: ['item_id'],
    });
    return savedItems.map((si) => si.item_id);
  }
}

export default new SavedItemsService();
