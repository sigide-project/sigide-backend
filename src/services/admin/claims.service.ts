import type { WhereOptions } from 'sequelize';
import { Claim, Item, User, Message } from '../../models';
import type { ClaimStatus } from '../../types';

const CLAIM_SORTABLE: Record<string, 'createdAt' | 'updatedAt' | 'status'> = {
  created_at: 'createdAt',
  updated_at: 'updatedAt',
  status: 'status',
};

export interface GetAdminClaimsParams {
  page: number;
  limit: number;
  status?: ClaimStatus;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface AdminClaimsListResult {
  claims: Claim[];
  total: number;
  page: number;
  pages: number;
}

export async function getAdminClaims(params: GetAdminClaimsParams): Promise<AdminClaimsListResult> {
  const page = params.page < 1 ? 1 : params.page;
  const limit = params.limit < 1 ? 20 : params.limit;
  const offset = (page - 1) * limit;

  const where: WhereOptions<Claim> = {};
  if (params.status) {
    where.status = params.status;
  }

  const sortKey =
    params.sort && CLAIM_SORTABLE[params.sort] ? CLAIM_SORTABLE[params.sort] : 'createdAt';
  const direction = params.order?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const { rows, count } = await Claim.findAndCountAll({
    where,
    include: [
      {
        model: Item,
        as: 'item',
        attributes: ['id', 'title', 'type'],
        include: [{ model: User, as: 'owner', attributes: ['id', 'name', 'email', 'avatar_url'] }],
      },
      { model: User, as: 'claimant', attributes: ['id', 'name'] },
    ],
    order: [[sortKey, direction]],
    limit,
    offset,
  });

  return {
    claims: rows,
    total: count,
    page,
    pages: Math.ceil(count / limit) || 0,
  };
}

export async function getAdminClaimById(id: string): Promise<Claim> {
  const claim = await Claim.findByPk(id, {
    include: [
      {
        model: Item,
        as: 'item',
        include: [{ model: User, as: 'owner' }],
      },
      { model: User, as: 'claimant' },
      {
        model: Message,
        as: 'messages',
        separate: true,
        include: [{ model: User, as: 'sender' }],
        order: [['createdAt', 'ASC']],
      },
    ],
  });
  if (!claim) {
    throw new Error('Claim not found');
  }
  return claim;
}

export async function updateClaimStatus(id: string, status: string): Promise<Claim> {
  const claim = await Claim.findByPk(id);
  if (!claim) {
    throw new Error('Claim not found');
  }
  claim.status = status as ClaimStatus;
  if (status === 'resolved') {
    claim.resolved_at = new Date();
  }
  await claim.save();
  return claim;
}
