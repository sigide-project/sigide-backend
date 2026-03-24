import { DataTypes, Model, Sequelize } from 'sequelize';
import { ItemAttributes, ItemCreationAttributes, ItemType, ItemStatus } from '../types';
import { User } from './User';

export class Item extends Model<ItemAttributes, ItemCreationAttributes> implements ItemAttributes {
  declare id: string;
  declare user_id: string;
  declare type: ItemType;
  declare status: ItemStatus;
  declare title: string;
  declare description: string | null;
  declare category: string | null;
  declare image_urls: string[];
  declare location_name: string | null;
  declare location: { type: 'Point'; coordinates: [number, number] } | null;
  declare reward_amount: number;
  declare lost_found_at: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  declare owner?: User;
}

export default (sequelize: Sequelize): typeof Item => {
  Item.init(
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
        type: DataTypes.ENUM('lost', 'found'),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('open', 'claimed', 'resolved', 'cancelled'),
        defaultValue: 'open',
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
      },
      category: {
        type: DataTypes.STRING(50),
      },
      image_urls: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        defaultValue: [],
      },
      location_name: {
        type: DataTypes.STRING(255),
      },
      reward_amount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      lost_found_at: {
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      tableName: 'items',
      underscored: true,
    }
  );

  return Item;
};
