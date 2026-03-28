import { Request, Response } from 'express';
import type { WhereOptions } from 'sequelize';
import { Op } from 'sequelize';
import { Feedback } from '../../models';

const FEEDBACK_SORTABLE: Record<string, 'createdAt' | 'updatedAt' | 'rating'> = {
  created_at: 'createdAt',
  updated_at: 'updatedAt',
  rating: 'rating',
};

export async function getFeedback(req: Request, res: Response): Promise<void | Response> {
  try {
    const pageRaw = parseInt(String(req.query.page ?? '1'), 10);
    const limitRaw = parseInt(String(req.query.limit ?? '20'), 10);
    const page = Number.isNaN(pageRaw) || pageRaw < 1 ? 1 : pageRaw;
    const limit = Number.isNaN(limitRaw) || limitRaw < 1 ? 20 : limitRaw;
    const offset = (page - 1) * limit;

    const sortParam = (req.query.sort as string) || 'created_at';
    const sortKey =
      FEEDBACK_SORTABLE[sortParam] ?? FEEDBACK_SORTABLE.created_at;
    const orderDir =
      String(req.query.order ?? 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const minRaw = req.query.min_rating;
    const maxRaw = req.query.max_rating;
    const minNum =
      minRaw !== undefined && minRaw !== ''
        ? parseInt(String(minRaw), 10)
        : undefined;
    const maxNum =
      maxRaw !== undefined && maxRaw !== ''
        ? parseInt(String(maxRaw), 10)
        : undefined;

    const where: WhereOptions<Feedback> = {};
    const ratingWhere: { [Op.gte]?: number; [Op.lte]?: number } = {};
    if (minNum !== undefined && !Number.isNaN(minNum)) {
      ratingWhere[Op.gte] = minNum;
    }
    if (maxNum !== undefined && !Number.isNaN(maxNum)) {
      ratingWhere[Op.lte] = maxNum;
    }
    if (Object.keys(ratingWhere).length > 0) {
      where.rating = ratingWhere;
    }

    const { rows, count } = await Feedback.findAndCountAll({
      where,
      order: [[sortKey, orderDir]],
      limit,
      offset,
    });

    const pages = Math.ceil(count / limit) || 0;
    return res.json({
      success: true,
      data: { feedback: rows, total: count, page, pages },
    });
  } catch (error) {
    console.error('Admin getFeedback error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch feedback' });
  }
}
