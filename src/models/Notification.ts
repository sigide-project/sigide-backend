import { DataTypes, Model, Sequelize } from 'sequelize';
import { NotificationAttributes, NotificationCreationAttributes } from '../types';

export class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> implements NotificationAttributes {
  declare id: string;
  declare user_id: string;
  declare type: string;
  declare payload: Record<string, unknown>;
  declare read: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export default (sequelize: Sequelize): typeof Notification => {
  Notification.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      payload: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      tableName: 'notifications',
      underscored: true,
    }
  );

  return Notification;
};
