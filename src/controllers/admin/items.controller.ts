import { Request, Response } from 'express';
import type { ItemType, ItemStatus } from '../../types';
import {
  getAdminItems,
  getAdminItemById,
  updateItemStatus as updateItemStatusService,
  deleteItem as deleteItemService,
} from '../../services/admin/items.service';

function isNotFound(err: unknown): boolean {
  return err instanceof Error && /not found/i.test(err.message);
}

function routeId(req: Request): string {
  const v = req.params.id;
  return Array.isArray(v) ? v[0]! : v!;
}

export async function getItems(req: Request, res: Response): Promise<void | Response> {
  try {
    const pageRaw = parseInt(String(req.query.page ?? '1'), 10);
    const limitRaw = parseInt(String(req.query.limit ?? '20'), 10);
    const page = Number.isNaN(pageRaw) || pageRaw < 1 ? 1 : pageRaw;
    const limit = Number.isNaN(limitRaw) || limitRaw < 1 ? 20 : limitRaw;
    const search = req.query.search as string | undefined;
    const type = req.query.type as ItemType | undefined;
    const status = req.query.status as ItemStatus | undefined;
    const category = req.query.category as string | undefined;
    const sort = req.query.sort as string | undefined;
    const order = req.query.order as 'asc' | 'desc' | undefined;

    const data = await getAdminItems({
      page,
      limit,
      search,
      type,
      status,
      category,
      sort,
      order,
    });
    return res.json({ success: true, data });
  } catch (error) {
    console.error('Admin getItems error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch items' });
  }
}

export async function getItemById(req: Request, res: Response): Promise<void | Response> {
  try {
    const id = routeId(req);
    const item = await getAdminItemById(id);
    return res.json({ success: true, data: { item } });
  } catch (error) {
    if (isNotFound(error)) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    console.error('Admin getItemById error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch item' });
  }
}

export async function updateItemStatus(req: Request, res: Response): Promise<void | Response> {
  try {
    const id = routeId(req);
    const { status } = req.body;
    const item = await updateItemStatusService(id, status);
    return res.json({ success: true, data: { item } });
  } catch (error) {
    if (isNotFound(error)) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    console.error('Admin updateItemStatus error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update item status' });
  }
}

export async function deleteItem(req: Request, res: Response): Promise<void | Response> {
  try {
    const id = routeId(req);
    await deleteItemService(id);
    return res.status(204).send();
  } catch (error) {
    if (isNotFound(error)) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    console.error('Admin deleteItem error:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete item' });
  }
}
