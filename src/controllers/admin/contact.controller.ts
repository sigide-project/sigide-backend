import { Request, Response } from 'express';
import type { WhereOptions } from 'sequelize';
import { Op } from 'sequelize';
import { ContactMessage } from '../../models';

const CONTACT_SORTABLE: Record<string, 'createdAt' | 'updatedAt' | 'subject' | 'name'> = {
  created_at: 'createdAt',
  updated_at: 'updatedAt',
  subject: 'subject',
  name: 'name',
};

export async function getContact(req: Request, res: Response): Promise<void | Response> {
  try {
    const pageRaw = parseInt(String(req.query.page ?? '1'), 10);
    const limitRaw = parseInt(String(req.query.limit ?? '20'), 10);
    const page = Number.isNaN(pageRaw) || pageRaw < 1 ? 1 : pageRaw;
    const limit = Number.isNaN(limitRaw) || limitRaw < 1 ? 20 : limitRaw;
    const offset = (page - 1) * limit;

    const sortParam = (req.query.sort as string) || 'created_at';
    const sortKey =
      CONTACT_SORTABLE[sortParam] ?? CONTACT_SORTABLE.created_at;
    const orderDir =
      String(req.query.order ?? 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const term = search ? `%${search}%` : '';
    const where: WhereOptions<ContactMessage> = search
      ? ({
          [Op.or]: [
            { name: { [Op.iLike]: term } },
            { subject: { [Op.iLike]: term } },
          ],
        } as WhereOptions<ContactMessage>)
      : {};

    const { rows, count } = await ContactMessage.findAndCountAll({
      where,
      order: [[sortKey, orderDir]],
      limit,
      offset,
    });

    const pages = Math.ceil(count / limit) || 0;
    return res.json({
      success: true,
      data: { messages: rows, total: count, page, pages },
    });
  } catch (error) {
    console.error('Admin getContact error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch contact messages' });
  }
}
