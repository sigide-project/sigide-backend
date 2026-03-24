import { Request, Response } from "express";
import itemService from "../services/items";
import {
  ItemFilters,
  UserItemFilters,
  CreateItemInput,
  UpdateItemInput,
  ItemSortBy,
  SortOrder,
} from "../types";
import { User } from "../models";

class ItemController {
  async list(req: Request, res: Response): Promise<void> {
    console.log("[ItemController.list] query params:", req.query);
    try {
      const {
        lat,
        lng,
        radius,
        minDistance,
        maxDistance,
        type,
        category,
        tags,
        status,
        search,
        sortBy,
        sortOrder,
        page,
        limit,
      } = req.query;

      const filters: ItemFilters = {
        type: type as ItemFilters["type"],
        category: category as string,
        status: status as ItemFilters["status"],
        search: search as string,
        sortBy: (sortBy as ItemSortBy) || 'createdAt',
        sortOrder: (sortOrder as SortOrder) || 'desc',
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      };

      if (lat && lng) {
        filters.lat = parseFloat(lat as string);
        filters.lng = parseFloat(lng as string);
      }

      if (radius) {
        filters.radius = parseFloat(radius as string);
      }

      if (minDistance) {
        filters.minDistance = parseFloat(minDistance as string);
      }

      if (maxDistance) {
        filters.maxDistance = parseFloat(maxDistance as string);
      }

      if (tags) {
        filters.tags = Array.isArray(tags)
          ? (tags as string[])
          : (tags as string).split(',').map((t) => t.trim());
      }

      console.log("[ItemController.list] filters:", JSON.stringify(filters));
      const result = await itemService.findAll(filters);
      console.log(
        "[ItemController.list] result items count:",
        result.items?.length,
      );

      res.json({
        success: true,
        data: result.items,
        pagination: result.pagination,
      });
    } catch (error) {
      const err = error as Error;
      console.error("[ItemController.list] ERROR:", err.message);
      console.error("[ItemController.list] Stack:", err.stack);
      res.status(500).json({
        success: false,
        message: "Failed to fetch items",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    }
  }

  async get(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const item = await itemService.findById(id);

      if (!item) {
        res.status(404).json({
          success: false,
          message: "Item not found",
        });
        return;
      }

      res.json({
        success: true,
        data: item,
      });
    } catch (error) {
      const err = error as Error;
      console.error("Error fetching item:", err);
      res.status(500).json({
        success: false,
        message: "Failed to fetch item",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req.user as User).id;
      const item = await itemService.create(
        req.body as CreateItemInput,
        userId,
      );

      res.status(201).json({
        item,
      });
    } catch (error) {
      const err = error as Error;
      console.error("Error creating item:", err);
      res.status(500).json({
        success: false,
        message: "Failed to create item",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const userId = (req.user as User).id;
      const result = await itemService.update(
        id,
        userId,
        req.body as UpdateItemInput,
      );

      if (result.notFound) {
        res.status(404).json({
          success: false,
          message: "Item not found",
        });
        return;
      }

      if (result.forbidden) {
        res.status(403).json({
          success: false,
          message: "You are not authorized to update this item",
        });
        return;
      }

      res.json({
        success: true,
        item: result.item,
      });
    } catch (error) {
      const err = error as Error;
      console.error("Error updating item:", err);
      res.status(500).json({
        success: false,
        message: "Failed to update item",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    }
  }

  async resolve(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const userId = (req.user as User).id;
      const result = await itemService.resolve(id, userId);

      if (result.notFound) {
        res.status(404).json({
          success: false,
          message: "Item not found",
        });
        return;
      }

      if (result.forbidden) {
        res.status(403).json({
          success: false,
          message: "You are not authorized to resolve this item",
        });
        return;
      }

      res.json({
        success: true,
        data: result.item,
        message: "Item marked as resolved",
      });
    } catch (error) {
      const err = error as Error;
      console.error("Error resolving item:", err);
      res.status(500).json({
        success: false,
        message: "Failed to resolve item",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const userId = (req.user as User).id;
      const result = await itemService.delete(id, userId);

      if (result.notFound) {
        res.status(404).json({
          success: false,
          message: "Item not found",
        });
        return;
      }

      if (result.forbidden) {
        res.status(403).json({
          success: false,
          message: "You are not authorized to delete this item",
        });
        return;
      }

      res.status(204).send();
    } catch (error) {
      const err = error as Error;
      console.error("Error deleting item:", err);
      res.status(500).json({
        success: false,
        message: "Failed to delete item",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    }
  }

  async listUserItems(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req.user as User).id;
      const { type, status, page, limit } = req.query;

      const result = await itemService.findByUser(userId, {
        type: type as UserItemFilters["type"],
        status: status as UserItemFilters["status"],
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      res.json({
        success: true,
        items: result.items,
        pagination: result.pagination,
      });
    } catch (error) {
      const err = error as Error;
      console.error("Error listing user items:", err);
      res.status(500).json({
        success: false,
        message: "Failed to fetch user items",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    }
  }
}

export default new ItemController();
