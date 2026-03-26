import { Request, Response } from 'express';
import claimService from '../services/claims';
import { AuthenticatedUser } from '../types';

class ClaimController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as AuthenticatedUser;
      const { item_id, proof_description, proof_images } = req.body;

      if (!item_id || !proof_description) {
        res.status(400).json({ success: false, message: 'item_id and proof_description are required' });
        return;
      }

      if (proof_description.length < 10) {
        res.status(400).json({ success: false, message: 'proof_description must be at least 10 characters' });
        return;
      }

      if (proof_images && proof_images.length > 5) {
        res.status(400).json({ success: false, message: 'Maximum 5 proof images allowed' });
        return;
      }

      const result = await claimService.createClaim(user.id, {
        item_id,
        proof_description,
        proof_images,
      });

      if (result.error) {
        res.status(result.status!).json({ success: false, message: result.error });
        return;
      }

      res.status(201).json({ success: true, claim: result.claim });
    } catch (error) {
      const err = error as Error;
      console.error('Error creating claim:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to create claim',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      });
    }
  }

  async getMyClaims(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as AuthenticatedUser;
      const claims = await claimService.getMyClaims(user.id);
      res.json({ success: true, claims });
    } catch (error) {
      const err = error as Error;
      console.error('Error fetching my claims:', err);
      res.status(500).json({ success: false, message: 'Failed to fetch claims' });
    }
  }

  async getClaimsOnMyItems(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as AuthenticatedUser;
      const claims = await claimService.getClaimsOnMyItems(user.id);
      res.json({ success: true, claims });
    } catch (error) {
      const err = error as Error;
      console.error('Error fetching claims on my items:', err);
      res.status(500).json({ success: false, message: 'Failed to fetch claims' });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as AuthenticatedUser;
      const id = req.params.id as string;
      const result = await claimService.getClaimById(id, user.id);

      if (result.error) {
        res.status(result.status!).json({ success: false, message: result.error });
        return;
      }

      res.json({ success: true, claim: result.claim });
    } catch (error) {
      const err = error as Error;
      console.error('Error fetching claim:', err);
      res.status(500).json({ success: false, message: 'Failed to fetch claim' });
    }
  }

  async accept(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as AuthenticatedUser;
      const id = req.params.id as string;
      const result = await claimService.acceptClaim(id, user.id);

      if (result.error) {
        res.status(result.status!).json({ success: false, message: result.error });
        return;
      }

      res.json({ success: true, claim: result.claim });
    } catch (error) {
      const err = error as Error;
      console.error('Error accepting claim:', err);
      res.status(500).json({ success: false, message: 'Failed to accept claim' });
    }
  }

  async reject(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as AuthenticatedUser;
      const id = req.params.id as string;
      const result = await claimService.rejectClaim(id, user.id);

      if (result.error) {
        res.status(result.status!).json({ success: false, message: result.error });
        return;
      }

      res.json({ success: true, claim: result.claim });
    } catch (error) {
      const err = error as Error;
      console.error('Error rejecting claim:', err);
      res.status(500).json({ success: false, message: 'Failed to reject claim' });
    }
  }

  async resolve(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as AuthenticatedUser;
      const id = req.params.id as string;
      const result = await claimService.resolveClaim(id, user.id);

      if (result.error) {
        res.status(result.status!).json({ success: false, message: result.error });
        return;
      }

      res.json({ success: true, claim: result.claim });
    } catch (error) {
      const err = error as Error;
      console.error('Error resolving claim:', err);
      res.status(500).json({ success: false, message: 'Failed to resolve claim' });
    }
  }

  async getMyChats(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as AuthenticatedUser;
      const chats = await claimService.getMyChats(user.id);
      res.json({ success: true, chats });
    } catch (error) {
      const err = error as Error;
      console.error('Error fetching my chats:', err);
      res.status(500).json({ success: false, message: 'Failed to fetch chats' });
    }
  }

  async deleteChat(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as AuthenticatedUser;
      const id = req.params.id as string;
      const result = await claimService.deleteChat(id, user.id);

      if (result.error) {
        res.status(result.status!).json({ success: false, message: result.error });
        return;
      }

      res.status(204).send();
    } catch (error) {
      const err = error as Error;
      console.error('Error deleting chat:', err);
      res.status(500).json({ success: false, message: 'Failed to delete chat' });
    }
  }
}

export default new ClaimController();
