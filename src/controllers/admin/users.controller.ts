import { Request, Response } from 'express';
import type { User } from '../../models';
import {
  getAdminUsers,
  getAdminUserById,
  banUser as banUserService,
  unbanUser as unbanUserService,
  makeAdmin as makeAdminService,
} from '../../services/admin/users.service';

function userWithoutPassword(user: User) {
  const o = user.get({ plain: true });
  const { password_hash: _pw, ...rest } = o;
  return rest;
}

function isNotFound(err: unknown): boolean {
  return err instanceof Error && /not found/i.test(err.message);
}

function routeId(req: Request): string {
  const v = req.params.id;
  return Array.isArray(v) ? v[0]! : v!;
}

export async function getUsers(req: Request, res: Response): Promise<void | Response> {
  try {
    const pageRaw = parseInt(String(req.query.page ?? '1'), 10);
    const limitRaw = parseInt(String(req.query.limit ?? '20'), 10);
    const page = Number.isNaN(pageRaw) || pageRaw < 1 ? 1 : pageRaw;
    const limit = Number.isNaN(limitRaw) || limitRaw < 1 ? 20 : limitRaw;
    const search = req.query.search as string | undefined;
    const role = req.query.role as 'user' | 'admin' | 'banned' | undefined;
    const status = req.query.status as 'active' | 'banned' | undefined;
    const sort = req.query.sort as string | undefined;
    const order = req.query.order as 'asc' | 'desc' | undefined;

    const data = await getAdminUsers({
      page,
      limit,
      search,
      role,
      status,
      sort,
      order,
    });
    return res.json({ success: true, data });
  } catch (error) {
    console.error('Admin getUsers error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
}

export async function getUserById(req: Request, res: Response): Promise<void | Response> {
  try {
    const id = routeId(req);
    const data = await getAdminUserById(id);
    return res.json({ success: true, data });
  } catch (error) {
    if (isNotFound(error)) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    console.error('Admin getUserById error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
}

export async function banUser(req: Request, res: Response): Promise<void | Response> {
  try {
    const id = routeId(req);
    const user = await banUserService(id);
    return res.json({ success: true, data: { user: userWithoutPassword(user) } });
  } catch (error) {
    if (isNotFound(error)) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    console.error('Admin banUser error:', error);
    return res.status(500).json({ success: false, error: 'Failed to ban user' });
  }
}

export async function unbanUser(req: Request, res: Response): Promise<void | Response> {
  try {
    const id = routeId(req);
    const user = await unbanUserService(id);
    return res.json({ success: true, data: { user: userWithoutPassword(user) } });
  } catch (error) {
    if (isNotFound(error)) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    console.error('Admin unbanUser error:', error);
    return res.status(500).json({ success: false, error: 'Failed to unban user' });
  }
}

export async function makeAdmin(req: Request, res: Response): Promise<void | Response> {
  try {
    const id = routeId(req);
    const user = await makeAdminService(id);
    return res.json({ success: true, data: { user: userWithoutPassword(user) } });
  } catch (error) {
    if (isNotFound(error)) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    console.error('Admin makeAdmin error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update user role' });
  }
}
