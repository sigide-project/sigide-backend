import { Request, Response } from 'express';
import reportsService from '../services/reports';
import type { IssueType } from '../models/Report';

class ReportsController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { issue_type, email, listing_url, description } = req.body;
      const userId = req.user?.id ?? null;

      await reportsService.createReport(
        {
          issue_type: issue_type as IssueType,
          email,
          listing_url,
          description,
        },
        userId
      );

      res.status(201).json({
        success: true,
        message: 'Your report has been submitted.',
      });
    } catch (error) {
      const err = error as Error;
      console.error('Error creating report:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to submit report',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      });
    }
  }
}

export default new ReportsController();
