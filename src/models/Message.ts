import { DataTypes, Model, Sequelize } from 'sequelize';
import { MessageAttributes, MessageCreationAttributes } from '../types';

export class Message extends Model<MessageAttributes, MessageCreationAttributes> implements MessageAttributes {
  declare id: string;
  declare claim_id: string;
  declare sender_id: string;
  declare content: string;
  declare read_at: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export default (sequelize: Sequelize): typeof Message => {
  Message.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      claim_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      sender_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      read_at: {
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      tableName: 'messages',
      underscored: true,
    }
  );

  return Message;
};
