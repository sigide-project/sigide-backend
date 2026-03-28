import type { WhereOptions } from 'sequelize';
import { Op } from 'sequelize';
import { Item, User, Claim, Message, sequelize } from '../../models';
import type { ItemStatus, ItemType } from '../../types';

const ITEM_SORTABLE: Record<
  string,
  'createdAt' | 'updatedAt' | 'title' | 'status' | 'type' | 'category' | 'reward_amount'
> = {
  created_at: 'createdAt',
  updated_at: 'updatedAt',
  title: 'title',
  status: 'status',
  type: 'type',
  category: 'category',
  reward_amount: 'reward_amount',
};

export interface GetAdminItemsParams {
  page: number;
  limit: number;
  search?: string;
  type?: ItemType;
  status?: ItemStatus;
  category?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface AdminItemsListResult {
  items: Item[];
  total: number;
  page: number;
  pages: number;
}

export async function getAdminItems(params: GetAdminItemsParams): Promise<AdminItemsListResult> {
  const page = params.page < 1 ? 1 : params.page;
  const limit = params.limit < 1 ? 20 : params.limit;
  const offset = (page - 1) * limit;

  const where: WhereOptions<Item> = {};

  if (params.search?.trim()) {
    where.title = { [Op.iLike]: `%${params.search.trim()}%` };
  }
  if (params.type) {
    where.type = params.type;
  }
  if (params.status) {
    where.status = params.status;
  }
  if (params.category) {
    where.category = params.category;
  }

  const sortKey =
    params.sort && ITEM_SORTABLE[params.sort] ? ITEM_SORTABLE[params.sort] : 'createdAt';
  const direction = params.order?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const claimsCountLiteral = sequelize.literal(
    '(SELECT COUNT(*)::int FROM claims WHERE claims.item_id = "Item".id)'
  );

  const { rows, count } = await Item.findAndCountAll({
    where,
    attributes: {
      include: [[claimsCountLiteral, 'claims_count']],
    },
    include: [
      {
        model: User,
        as: 'owner',
        attributes: ['id', 'name', 'email', 'avatar_url'],
      },
    ],
    order: [[sortKey, direction]],
    limit,
    offset,
  });

  return {
    items: rows,
    total: count,
    page,
    pages: Math.ceil(count / limit) || 0,
  };
}

export async function getAdminItemById(id: string): Promise<Item> {
  const item = await Item.findByPk(id, {
    include: [
      { model: User, as: 'owner' },
      {
        model: Claim,
        as: 'claims',
        include: [{ model: User, as: 'claimant' }],
      },
    ],
  });
  if (!item) {
    throw new Error('Item not found');
  }
  return item;
}

export async function updateItemStatus(id: string, status: string): Promise<Item> {
  const item = await Item.findByPk(id);
  if (!item) {
    throw new Error('Item not found');
  }
  item.status = status as ItemStatus;
  await item.save();
  return item;
}

export async function deleteItem(id: string): Promise<void> {
  await sequelize.transaction(async transaction => {
    const claims = await Claim.findAll({
      where: { item_id: id },
      attributes: ['id'],
      transaction,
    });
    const claimIds = claims.map(c => c.id);
    if (claimIds.length > 0) {
      await Message.destroy({ where: { claim_id: { [Op.in]: claimIds } }, transaction });
    }
    await Claim.destroy({ where: { item_id: id }, transaction });
    const deleted = await Item.destroy({ where: { id }, transaction });
    if (deleted === 0) {
      throw new Error('Item not found');
    }
  });
}
