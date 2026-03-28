import { Request, Response } from 'express';
import contactService from '../services/contact';

class ContactController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, subject, message } = req.body;
      const userId = req.user?.id ?? null;

      await contactService.createContactMessage(
        { name, email, subject, message },
        userId
      );

      res.status(201).json({
        success: true,
        message: 'Your message has been sent.',
      });
    } catch (error) {
      const err = error as Error;
      console.error('Error creating contact message:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to send message',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      });
    }
  }
}

export default new ContactController();
