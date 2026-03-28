import { Request, Response } from 'express';
import { getAdminStats } from '../../services/admin/stats.service';

export async function getStats(_req: Request, res: Response): Promise<void | Response> {
  try {
    const stats = await getAdminStats();
    return res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Admin stats error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
}
