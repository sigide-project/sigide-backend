import { Request, Response } from 'express';
import feedbackService from '../services/feedback';

class FeedbackController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { rating, name, email, feedback } = req.body;
      const userId = req.user?.id ?? null;

      await feedbackService.createFeedback(
        { rating, name, email, feedback },
        userId
      );

      res.status(201).json({
        success: true,
        message: 'Thank you for your feedback.',
      });
    } catch (error) {
      const err = error as Error;
      console.error('Error creating feedback:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to submit feedback',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      });
    }
  }
}

export default new FeedbackController();
