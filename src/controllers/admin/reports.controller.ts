import { Request, Response } from 'express';
import type { IssueType, ReportStatus } from '../../models/Report';
import {
  getAdminReports,
  getAdminReportById,
  updateReportStatus as updateReportStatusService,
} from '../../services/admin/reports.service';

function isNotFound(err: unknown): boolean {
  return err instanceof Error && /not found/i.test(err.message);
}

function routeId(req: Request): string {
  const v = req.params.id;
  return Array.isArray(v) ? v[0]! : v!;
}

export async function getReports(req: Request, res: Response): Promise<void | Response> {
  try {
    const pageRaw = parseInt(String(req.query.page ?? '1'), 10);
    const limitRaw = parseInt(String(req.query.limit ?? '20'), 10);
    const page = Number.isNaN(pageRaw) || pageRaw < 1 ? 1 : pageRaw;
    const limit = Number.isNaN(limitRaw) || limitRaw < 1 ? 20 : limitRaw;
    const status = req.query.status as ReportStatus | undefined;
    const issue_type = req.query.issue_type as IssueType | undefined;
    const sort = req.query.sort as string | undefined;
    const order = req.query.order as 'asc' | 'desc' | undefined;

    const data = await getAdminReports({ page, limit, status, issue_type, sort, order });
    return res.json({ success: true, data });
  } catch (error) {
    console.error('Admin getReports error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch reports' });
  }
}

export async function getReportById(req: Request, res: Response): Promise<void | Response> {
  try {
    const id = routeId(req);
    const report = await getAdminReportById(id);
    return res.json({ success: true, data: { report } });
  } catch (error) {
    if (isNotFound(error)) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }
    console.error('Admin getReportById error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch report' });
  }
}

export async function updateReportStatus(req: Request, res: Response): Promise<void | Response> {
  try {
    const id = routeId(req);
    const { status } = req.body;
    const report = await updateReportStatusService(id, status);
    return res.json({ success: true, data: { report } });
  } catch (error) {
    if (isNotFound(error)) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }
    console.error('Admin updateReportStatus error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update report status' });
  }
}
