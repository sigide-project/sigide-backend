import { DataTypes, Model, Sequelize } from 'sequelize';
import { SavedItemAttributes, SavedItemCreationAttributes } from '../types';
import { User } from './User';
import { Item } from './Item';

export class SavedItem extends Model<SavedItemAttributes, SavedItemCreationAttributes> implements SavedItemAttributes {
  declare id: string;
  declare user_id: string;
  declare item_id: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  declare user?: User;
  declare item?: Item;
}

export default (sequelize: Sequelize): typeof SavedItem => {
  SavedItem.init(
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
      item_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'saved_items',
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['user_id', 'item_id'],
        },
      ],
    }
  );

  return SavedItem;
};
