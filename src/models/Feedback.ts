import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface FeedbackAttributes {
  id: string;
  user_id: string | null;
  rating: number | null;
  name: string | null;
  email: string | null;
  feedback: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type FeedbackCreationAttributes = Optional<
  FeedbackAttributes,
  'id' | 'user_id' | 'rating' | 'name' | 'email'
>;

export class Feedback
  extends Model<FeedbackAttributes, FeedbackCreationAttributes>
  implements FeedbackAttributes
{
  declare id: string;
  declare user_id: string | null;
  declare rating: number | null;
  declare name: string | null;
  declare email: string | null;
  declare feedback: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export default (sequelize: Sequelize): typeof Feedback => {
  Feedback.init(
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
      rating: {
        type: DataTypes.SMALLINT,
        allowNull: true,
        validate: {
          min: 1,
          max: 5,
        },
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: { isEmail: true },
      },
      feedback: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'feedback',
      underscored: true,
    }
  );

  return Feedback;
};
