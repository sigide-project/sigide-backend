import type { WhereOptions } from 'sequelize';
import { Report, User } from '../../models';
import type { IssueType, ReportStatus } from '../../models/Report';

const REPORT_SORTABLE: Record<string, 'createdAt' | 'updatedAt' | 'status' | 'issue_type'> = {
  created_at: 'createdAt',
  updated_at: 'updatedAt',
  status: 'status',
  issue_type: 'issue_type',
};

export interface GetAdminReportsParams {
  page: number;
  limit: number;
  status?: ReportStatus;
  issue_type?: IssueType;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface AdminReportsListResult {
  reports: Report[];
  total: number;
  page: number;
  pages: number;
}

export async function getAdminReports(params: GetAdminReportsParams): Promise<AdminReportsListResult> {
  const page = params.page < 1 ? 1 : params.page;
  const limit = params.limit < 1 ? 20 : params.limit;
  const offset = (page - 1) * limit;

  const where: WhereOptions<Report> = {};
  if (params.status) {
    where.status = params.status;
  }
  if (params.issue_type) {
    where.issue_type = params.issue_type;
  }

  const sortKey =
    params.sort && REPORT_SORTABLE[params.sort] ? REPORT_SORTABLE[params.sort] : 'createdAt';
  const direction = params.order?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const { rows, count } = await Report.findAndCountAll({
    where,
    order: [[sortKey, direction]],
    limit,
    offset,
  });

  return {
    reports: rows,
    total: count,
    page,
    pages: Math.ceil(count / limit) || 0,
  };
}

export async function getAdminReportById(id: string): Promise<Report> {
  const report = await Report.findByPk(id, {
    include: [{ model: User, as: 'user', required: false }],
  });
  if (!report) {
    throw new Error('Report not found');
  }
  return report;
}

export async function updateReportStatus(id: string, status: string): Promise<Report> {
  const report = await Report.findByPk(id);
  if (!report) {
    throw new Error('Report not found');
  }
  report.status = status as ReportStatus;
  await report.save();
  return report;
}
