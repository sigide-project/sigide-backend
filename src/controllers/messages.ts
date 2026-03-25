import { Request, Response } from 'express';
import messageService from '../services/messages';
import { AuthenticatedUser } from '../types';

class MessageController {
  async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as AuthenticatedUser;
      const claimId = req.params.claimId as string;
      const result = await messageService.getMessages(claimId, user.id);

      if (result.error) {
        res.status(result.status!).json({ success: false, message: result.error });
        return;
      }

      const response: Record<string, unknown> = {
        success: true,
        messages: result.messages,
        claim: result.claim,
      };

      if (result.contact) {
        response.contact = result.contact;
      }

      res.json(response);
    } catch (error) {
      const err = error as Error;
      console.error('Error fetching messages:', err);
      res.status(500).json({ success: false, message: 'Failed to fetch messages' });
    }
  }

  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as AuthenticatedUser;
      const { content } = req.body;

      if (!content || content.trim().length === 0) {
        res.status(400).json({ success: false, message: 'Message content is required' });
        return;
      }

      if (content.length > 2000) {
        res.status(400).json({ success: false, message: 'Message content must be at most 2000 characters' });
        return;
      }

      const claimId = req.params.claimId as string;
      const result = await messageService.sendMessage(claimId, user.id, content.trim());

      if (result.error) {
        res.status(result.status!).json({ success: false, message: result.error });
        return;
      }

      res.status(201).json({ success: true, message: result.message });
    } catch (error) {
      const err = error as Error;
      console.error('Error sending message:', err);
      res.status(500).json({ success: false, message: 'Failed to send message' });
    }
  }
}

export default new MessageController();
