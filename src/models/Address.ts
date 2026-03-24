import { DataTypes, Model, Sequelize } from 'sequelize';
import { AddressAttributes, AddressCreationAttributes } from '../types';

export class Address extends Model<AddressAttributes, AddressCreationAttributes> implements AddressAttributes {
  declare id: string;
  declare user_id: string;
  declare label: string;
  declare address_line1: string;
  declare address_line2: string | null;
  declare city: string;
  declare state: string;
  declare postal_code: string;
  declare country: string;
  declare is_default: boolean;
  declare lat: number | null;
  declare lng: number | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export default (sequelize: Sequelize): typeof Address => {
  Address.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      label: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'Home',
      },
      address_line1: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      address_line2: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      city: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      state: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      postal_code: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      country: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: 'India',
      },
      is_default: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      lat: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      lng: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'addresses',
      underscored: true,
    }
  );

  return Address;
};
