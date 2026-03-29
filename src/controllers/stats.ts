import { Request, Response } from 'express';
import statsService from '../services/stats';

class StatsController {
  async getPublicStats(_req: Request, res: Response): Promise<void> {
    try {
      const stats = await statsService.getPublicStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      const err = error as Error;
      console.error('Error fetching public stats:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch stats',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      });
    }
  }
}

export default new StatsController();
