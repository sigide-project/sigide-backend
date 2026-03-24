import { Request, Response } from 'express';
import savedItemsService from '../services/savedItems';
import { User } from '../models';

class SavedItemsController {
  async saveItem(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req.user as User).id;
      const itemId = req.params.itemId as string;

      const result = await savedItemsService.saveItem(userId, itemId);

      if (result.itemNotFound) {
        res.status(404).json({
          success: false,
          message: 'Item not found',
        });
        return;
      }

      if (result.alreadySaved) {
        res.status(200).json({
          success: true,
          message: 'Item already saved',
          data: { saved: true },
        });
        return;
      }

      res.status(201).json({
        success: true,
        message: 'Item saved successfully',
        data: { saved: true },
      });
    } catch (error) {
      const err = error as Error;
      console.error('Error saving item:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to save item',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      });
    }
  }

  async unsaveItem(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req.user as User).id;
      const itemId = req.params.itemId as string;

      const result = await savedItemsService.unsaveItem(userId, itemId);

      if (result.notFound) {
        res.status(404).json({
          success: false,
          message: 'Saved item not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Item removed from saved',
        data: { saved: false },
      });
    } catch (error) {
      const err = error as Error;
      console.error('Error unsaving item:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to unsave item',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      });
    }
  }

  async checkSaved(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req.user as User).id;
      const itemId = req.params.itemId as string;

      const saved = await savedItemsService.isItemSaved(userId, itemId);

      res.json({
        success: true,
        data: { saved },
      });
    } catch (error) {
      const err = error as Error;
      console.error('Error checking saved status:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to check saved status',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      });
    }
  }

  async getSavedItems(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req.user as User).id;
      const { page, limit } = req.query;

      const result = await savedItemsService.getSavedItems(
        userId,
        page ? parseInt(page as string, 10) : undefined,
        limit ? parseInt(limit as string, 10) : undefined
      );

      res.json({
        success: true,
        data: result.items,
        pagination: result.pagination,
      });
    } catch (error) {
      const err = error as Error;
      console.error('Error fetching saved items:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch saved items',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      });
    }
  }

  async getSavedItemIds(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req.user as User).id;

      const itemIds = await savedItemsService.getSavedItemIds(userId);

      res.json({
        success: true,
        data: itemIds,
      });
    } catch (error) {
      const err = error as Error;
      console.error('Error fetching saved item IDs:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch saved item IDs',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      });
    }
  }
}

export default new SavedItemsController();
