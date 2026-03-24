import { DataTypes, Model, Sequelize } from 'sequelize';
import { RewardAttributes, RewardCreationAttributes, RewardStatus } from '../types';

export class Reward extends Model<RewardAttributes, RewardCreationAttributes> implements RewardAttributes {
  declare id: string;
  declare item_id: string;
  declare payer_id: string;
  declare payee_id: string | null;
  declare amount: number;
  declare status: RewardStatus;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export default (sequelize: Sequelize): typeof Reward => {
  Reward.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      item_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      payer_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      payee_id: {
        type: DataTypes.UUID,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('pending', 'released', 'cancelled'),
        defaultValue: 'pending',
      },
    },
    {
      sequelize,
      tableName: 'rewards',
      underscored: true,
    }
  );

  return Reward;
};
