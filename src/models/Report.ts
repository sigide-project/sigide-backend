import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export const VALID_ISSUE_TYPES = [
  'Bug or Technical Issue',
  'Suspicious User/Listing',
  'Inappropriate Content',
  'Scam or Fraud',
  'Account Issue',
  'Other',
] as const;

export const VALID_REPORT_STATUSES = [
  'open',
  'reviewing',
  'resolved',
  'dismissed',
] as const;

export type IssueType = (typeof VALID_ISSUE_TYPES)[number];
export type ReportStatus = (typeof VALID_REPORT_STATUSES)[number];

export interface ReportAttributes {
  id: string;
  user_id: string | null;
  issue_type: IssueType;
  email: string;
  listing_url: string | null;
  description: string;
  status: ReportStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ReportCreationAttributes = Optional<
  ReportAttributes,
  'id' | 'user_id' | 'listing_url' | 'status'
>;

export class Report
  extends Model<ReportAttributes, ReportCreationAttributes>
  implements ReportAttributes
{
  declare id: string;
  declare user_id: string | null;
  declare issue_type: IssueType;
  declare email: string;
  declare listing_url: string | null;
  declare description: string;
  declare status: ReportStatus;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export default (sequelize: Sequelize): typeof Report => {
  Report.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      issue_type: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          isIn: [VALID_ISSUE_TYPES as unknown as string[]],
        },
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: { isEmail: true },
      },
      listing_url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'open',
        validate: {
          isIn: [VALID_REPORT_STATUSES as unknown as string[]],
        },
      },
    },
    {
      sequelize,
      tableName: 'reports',
      underscored: true,
    }
  );

  return Report;
};
