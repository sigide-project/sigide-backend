import { QueryTypes } from 'sequelize';
import { sequelize } from '../../models';

export type AdminAnalyticsPeriod = '7d' | '30d' | '90d' | '1y';

function periodToStartDate(period: string): Date {
  const now = new Date();
  const d = new Date(now);
  switch (period) {
    case '7d':
      d.setDate(d.getDate() - 7);
      return d;
    case '90d':
      d.setDate(d.getDate() - 90);
      return d;
    case '1y':
      d.setDate(d.getDate() - 365);
      return d;
    case '30d':
    default:
      d.setDate(d.getDate() - 30);
      return d;
  }
}

export interface ItemsOverTimeRow {
  date: string;
  lost: string;
  found: string;
  resolved: string;
}

export interface ClaimsOverTimeRow {
  date: string;
  submitted: string;
  accepted: string;
}

export interface CategoryCountRow {
  category: string;
  count: string;
}

export interface LocationCountRow {
  location_name: string;
  count: string;
}

export interface SignupsOverTimeRow {
  date: string;
  count: string;
}

export interface RatingDistributionRow {
  rating: string;
  count: string;
}

export interface AdminAnalytics {
  items_over_time: ItemsOverTimeRow[];
  claims_over_time: ClaimsOverTimeRow[];
  top_categories: CategoryCountRow[];
  top_locations: LocationCountRow[];
  user_signups_over_time: SignupsOverTimeRow[];
  resolution_rate: number;
  avg_resolution_days: number | null;
  feedback_avg_rating: number | null;
  rating_distribution: RatingDistributionRow[];
}

export async function getAdminAnalytics(period: string): Promise<AdminAnalytics> {
  const startDate = periodToStartDate(period);

  const itemsOverTimeSql = `
    SELECT created_at::date AS date,
      COUNT(*) FILTER (WHERE type = 'lost')::text AS lost,
      COUNT(*) FILTER (WHERE type = 'found')::text AS found,
      COUNT(*) FILTER (WHERE status = 'resolved')::text AS resolved
    FROM items
    WHERE created_at >= :startDate
    GROUP BY created_at::date
    ORDER BY date
  `;

  const claimsOverTimeSql = `
    SELECT created_at::date AS date,
      COUNT(*)::text AS submitted,
      COUNT(*) FILTER (WHERE status = 'accepted')::text AS accepted
    FROM claims
    WHERE created_at >= :startDate
    GROUP BY created_at::date
    ORDER BY date
  `;

  const topCategoriesSql = `
    SELECT category, COUNT(*)::text AS count
    FROM items
    WHERE category IS NOT NULL AND created_at >= :startDate
    GROUP BY category
    ORDER BY COUNT(*) DESC
    LIMIT 10
  `;

  const topLocationsSql = `
    SELECT location_name, COUNT(*)::text AS count
    FROM items
    WHERE location_name IS NOT NULL AND created_at >= :startDate
    GROUP BY location_name
    ORDER BY COUNT(*) DESC
    LIMIT 10
  `;

  const signupsSql = `
    SELECT created_at::date AS date, COUNT(*)::text AS count
    FROM users
    WHERE created_at >= :startDate AND is_deleted = false
    GROUP BY created_at::date
    ORDER BY date
  `;

  const resolutionRateSql = `
    SELECT
      CASE WHEN COUNT(*) = 0 THEN 0
      ELSE (100.0 * COUNT(*) FILTER (WHERE status = 'resolved') / COUNT(*))
      END AS rate
    FROM items
    WHERE created_at >= :startDate
  `;

  const avgResolutionSql = `
    SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400.0) AS avg_days
    FROM items
    WHERE status = 'resolved' AND created_at >= :startDate
  `;

  const feedbackAvgSql = `
    SELECT AVG(rating)::float AS avg_rating
    FROM feedback
    WHERE rating IS NOT NULL
  `;

  const ratingDistSql = `
    SELECT rating::text AS rating, COUNT(*)::text AS count
    FROM feedback
    WHERE rating IS NOT NULL
    GROUP BY rating
    ORDER BY rating
  `;

  const replacements = { startDate };

  const [
    items_over_time,
    claims_over_time,
    top_categories,
    top_locations,
    user_signups_over_time,
    resolutionRows,
    avgResolutionRows,
    feedbackAvgRows,
    rating_distribution,
  ] = await Promise.all([
    sequelize.query<ItemsOverTimeRow>(itemsOverTimeSql, { replacements, type: QueryTypes.SELECT }),
    sequelize.query<ClaimsOverTimeRow>(claimsOverTimeSql, { replacements, type: QueryTypes.SELECT }),
    sequelize.query<CategoryCountRow>(topCategoriesSql, { replacements, type: QueryTypes.SELECT }),
    sequelize.query<LocationCountRow>(topLocationsSql, { replacements, type: QueryTypes.SELECT }),
    sequelize.query<SignupsOverTimeRow>(signupsSql, { replacements, type: QueryTypes.SELECT }),
    sequelize.query<{ rate: string }>(resolutionRateSql, { replacements, type: QueryTypes.SELECT }),
    sequelize.query<{ avg_days: string | null }>(avgResolutionSql, { replacements, type: QueryTypes.SELECT }),
    sequelize.query<{ avg_rating: string | null }>(feedbackAvgSql, { type: QueryTypes.SELECT }),
    sequelize.query<RatingDistributionRow>(ratingDistSql, { type: QueryTypes.SELECT }),
  ]);

  const resolution_rate = Number(resolutionRows[0]?.rate ?? 0);
  const avg_days_raw = avgResolutionRows[0]?.avg_days;
  const avg_resolution_days = avg_days_raw != null ? Number(avg_days_raw) : null;
  const avg_rating_raw = feedbackAvgRows[0]?.avg_rating;
  const feedback_avg_rating = avg_rating_raw != null ? Number(avg_rating_raw) : null;

  return {
    items_over_time,
    claims_over_time,
    top_categories,
    top_locations,
    user_signups_over_time,
    resolution_rate,
    avg_resolution_days,
    feedback_avg_rating,
    rating_distribution,
  };
}
