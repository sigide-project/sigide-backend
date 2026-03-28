import { DataTypes, Model, Sequelize } from 'sequelize';
import { UserAttributes, UserCreationAttributes } from '../types';

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: string;
  declare username: string;
  declare name: string;
  declare email: string;
  declare phone: string | null;
  declare password_hash: string;
  declare avatar_url: string | null;
  declare rating: number;
  declare role: 'user' | 'admin';
  declare isActive: boolean;
  declare isDeleted: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export default (sequelize: Sequelize): typeof User => {
  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
          is: /^[a-zA-Z0-9_-]+$/,
        },
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      phone: {
        type: DataTypes.STRING(20),
      },
      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      avatar_url: {
        type: DataTypes.TEXT,
      },
      rating: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
      },
      role: {
        type: DataTypes.ENUM('user', 'admin'),
        defaultValue: 'user',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      tableName: 'users',
      underscored: true,
    }
  );

  return User;
};
