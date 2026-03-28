import { Request, Response } from 'express';
import { getAdminAnalytics } from '../../services/admin/analytics.service';

export async function getAnalytics(req: Request, res: Response): Promise<void | Response> {
  try {
    const period = (req.query.period as string) || '30d';
    const data = await getAdminAnalytics(period);
    return res.json({ success: true, data });
  } catch (error) {
    console.error('Admin getAnalytics error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
  }
}
