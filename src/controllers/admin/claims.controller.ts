import { Request, Response } from 'express';
import type { ClaimStatus } from '../../types';
import {
  getAdminClaims,
  getAdminClaimById,
  updateClaimStatus as updateClaimStatusService,
} from '../../services/admin/claims.service';

function isNotFound(err: unknown): boolean {
  return err instanceof Error && /not found/i.test(err.message);
}

function routeId(req: Request): string {
  const v = req.params.id;
  return Array.isArray(v) ? v[0]! : v!;
}

export async function getClaims(req: Request, res: Response): Promise<void | Response> {
  try {
    const pageRaw = parseInt(String(req.query.page ?? '1'), 10);
    const limitRaw = parseInt(String(req.query.limit ?? '20'), 10);
    const page = Number.isNaN(pageRaw) || pageRaw < 1 ? 1 : pageRaw;
    const limit = Number.isNaN(limitRaw) || limitRaw < 1 ? 20 : limitRaw;
    const status = req.query.status as ClaimStatus | undefined;
    const sort = req.query.sort as string | undefined;
    const order = req.query.order as 'asc' | 'desc' | undefined;

    const data = await getAdminClaims({ page, limit, status, sort, order });
    return res.json({ success: true, data });
  } catch (error) {
    console.error('Admin getClaims error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch claims' });
  }
}

export async function getClaimById(req: Request, res: Response): Promise<void | Response> {
  try {
    const id = routeId(req);
    const claim = await getAdminClaimById(id);
    return res.json({ success: true, data: { claim } });
  } catch (error) {
    if (isNotFound(error)) {
      return res.status(404).json({ success: false, error: 'Claim not found' });
    }
    console.error('Admin getClaimById error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch claim' });
  }
}

export async function updateClaimStatus(req: Request, res: Response): Promise<void | Response> {
  try {
    const id = routeId(req);
    const { status } = req.body;
    const claim = await updateClaimStatusService(id, status);
    return res.json({ success: true, data: { claim } });
  } catch (error) {
    if (isNotFound(error)) {
      return res.status(404).json({ success: false, error: 'Claim not found' });
    }
    console.error('Admin updateClaimStatus error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update claim status' });
  }
}
