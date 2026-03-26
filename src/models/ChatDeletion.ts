import { DataTypes, Model, Sequelize } from 'sequelize';

export interface ChatDeletionAttributes {
  id: string;
  claim_id: string;
  user_id: string;
  deleted_at: Date;
}

export interface ChatDeletionCreationAttributes {
  claim_id: string;
  user_id: string;
  deleted_at?: Date;
}

export class ChatDeletion
  extends Model<ChatDeletionAttributes, ChatDeletionCreationAttributes>
  implements ChatDeletionAttributes
{
  declare id: string;
  declare claim_id: string;
  declare user_id: string;
  declare deleted_at: Date;
}

export default (sequelize: Sequelize): typeof ChatDeletion => {
  ChatDeletion.init(
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
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'chat_deletions',
      underscored: true,
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ['claim_id', 'user_id'],
        },
      ],
    }
  );

  return ChatDeletion;
};
