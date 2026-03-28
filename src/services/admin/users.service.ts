import type { WhereOptions } from 'sequelize';
import { Op } from 'sequelize';
import { User, Item, Claim, Report, sequelize } from '../../models';

const USER_SORTABLE: Record<string, 'createdAt' | 'updatedAt' | 'name' | 'email' | 'username' | 'role' | 'rating'> = {
  created_at: 'createdAt',
  updated_at: 'updatedAt',
  name: 'name',
  email: 'email',
  username: 'username',
  role: 'role',
  rating: 'rating',
};

export interface GetAdminUsersParams {
  page: number;
  limit: number;
  search?: string;
  role?: 'user' | 'admin' | 'banned';
  status?: 'active' | 'banned';
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface AdminUsersListResult {
  users: User[];
  total: number;
  page: number;
  pages: number;
}

export async function getAdminUsers(params: GetAdminUsersParams): Promise<AdminUsersListResult> {
  const page = params.page < 1 ? 1 : params.page;
  const limit = params.limit < 1 ? 20 : params.limit;
  const offset = (page - 1) * limit;

  const term = params.search?.trim() ? `%${params.search.trim()}%` : null;
  const where = {
    isDeleted: false,
    ...(term
      ? {
          [Op.or]: [{ name: { [Op.iLike]: term } }, { email: { [Op.iLike]: term } }],
        }
      : {}),
    ...(params.status === 'active'
      ? { isActive: true, role: { [Op.ne]: 'banned' as const } }
      : params.status === 'banned'
        ? { role: 'banned' as const }
        : params.role
          ? { role: params.role }
          : {}),
  } as WhereOptions<User>;

  const sortKey = params.sort && USER_SORTABLE[params.sort] ? USER_SORTABLE[params.sort] : 'createdAt';
  const direction = params.order?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const itemsCountLiteral = sequelize.literal(
    '(SELECT COUNT(*)::int FROM items WHERE items.user_id = "User".id)'
  );
  const claimsCountLiteral = sequelize.literal(
    '(SELECT COUNT(*)::int FROM claims WHERE claims.claimant_id = "User".id)'
  );

  const { rows, count } = await User.findAndCountAll({
    where,
    attributes: {
      include: [
        [itemsCountLiteral, 'items_count'],
        [claimsCountLiteral, 'claims_count'],
      ],
      exclude: ['password_hash'],
    },
    order: [[sortKey, direction]],
    limit,
    offset,
  });

  return {
    users: rows,
    total: count,
    page,
    pages: Math.ceil(count / limit) || 0,
  };
}

export interface AdminUserDetail {
  user: User;
  items: Item[];
  claims: Claim[];
  reports_count: number;
}

export async function getAdminUserById(id: string): Promise<AdminUserDetail> {
  const itemsCountLiteral = sequelize.literal(
    '(SELECT COUNT(*)::int FROM items WHERE items.user_id = "User".id)'
  );
  const claimsCountLiteral = sequelize.literal(
    '(SELECT COUNT(*)::int FROM claims WHERE claims.claimant_id = "User".id)'
  );

  const user = await User.findByPk(id, {
    attributes: {
      include: [
        [itemsCountLiteral, 'items_count'],
        [claimsCountLiteral, 'claims_count'],
      ],
      exclude: ['password_hash'],
    },
  });
  if (!user) {
    throw new Error('User not found');
  }

  const [items, claims, reports_count] = await Promise.all([
    Item.findAll({
      where: { user_id: id },
      order: [['createdAt', 'DESC']],
      limit: 10,
    }),
    Claim.findAll({
      where: { claimant_id: id },
      order: [['createdAt', 'DESC']],
      limit: 10,
      include: [{ model: Item, as: 'item', attributes: ['id', 'title', 'type'] }],
    }),
    Report.count({ where: { user_id: id } }),
  ]);

  return { user, items, claims, reports_count };
}

export async function banUser(id: string): Promise<User> {
  const user = await User.findByPk(id);
  if (!user) {
    throw new Error('User not found');
  }
  user.role = 'banned';
  user.isActive = false;
  await user.save();
  return user;
}

export async function unbanUser(id: string): Promise<User> {
  const user = await User.findByPk(id);
  if (!user) {
    throw new Error('User not found');
  }
  user.role = 'user';
  user.isActive = true;
  await user.save();
  return user;
}

export async function makeAdmin(id: string): Promise<User> {
  const user = await User.findByPk(id);
  if (!user) {
    throw new Error('User not found');
  }
  user.role = 'admin';
  await user.save();
  return user;
}
