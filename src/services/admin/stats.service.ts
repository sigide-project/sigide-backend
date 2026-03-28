import { Op } from 'sequelize';
import { User, Item, Claim, Report, Feedback, ContactMessage } from '../../models';

export interface AdminStats {
  total_users: number;
  total_items: number;
  open_items: number;
  claimed_items: number;
  resolved_items: number;
  total_claims: number;
  pending_claims: number;
  accepted_claims: number;
  total_reports: number;
  open_reports: number;
  new_feedback_count: number;
  new_contacts_count: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [
    total_users,
    total_items,
    open_items,
    claimed_items,
    resolved_items,
    total_claims,
    pending_claims,
    accepted_claims,
    total_reports,
    open_reports,
    new_feedback_count,
    new_contacts_count,
  ] = await Promise.all([
    User.count({ where: { isDeleted: false } }),
    Item.count(),
    Item.count({ where: { status: 'open' } }),
    Item.count({ where: { status: 'claimed' } }),
    Item.count({ where: { status: 'resolved' } }),
    Claim.count(),
    Claim.count({ where: { status: 'pending' } }),
    Claim.count({ where: { status: 'accepted' } }),
    Report.count(),
    Report.count({ where: { status: 'open' } }),
    Feedback.count({ where: { createdAt: { [Op.gte]: sevenDaysAgo } } }),
    ContactMessage.count({ where: { createdAt: { [Op.gte]: sevenDaysAgo } } }),
  ]);

  return {
    total_users,
    total_items,
    open_items,
    claimed_items,
    resolved_items,
    total_claims,
    pending_claims,
    accepted_claims,
    total_reports,
    open_reports,
    new_feedback_count,
    new_contacts_count,
  };
}
