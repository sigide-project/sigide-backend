import { Report } from '../models';
import type { ReportCreationAttributes, IssueType } from '../models/Report';

export interface CreateReportInput {
  issue_type: IssueType;
  email: string;
  listing_url?: string;
  description: string;
}

class ReportsService {
  async createReport(
    data: CreateReportInput,
    userId?: string | null
  ): Promise<Report> {
    const attrs: ReportCreationAttributes = {
      user_id: userId ?? null,
      issue_type: data.issue_type,
      email: data.email,
      listing_url: data.listing_url ?? null,
      description: data.description,
      status: 'open',
    };

    return Report.create(attrs);
  }
}

export default new ReportsService();
