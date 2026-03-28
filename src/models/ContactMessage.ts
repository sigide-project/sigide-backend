import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface ContactMessageAttributes {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ContactMessageCreationAttributes = Optional<
  ContactMessageAttributes,
  'id' | 'user_id'
>;

export class ContactMessage
  extends Model<ContactMessageAttributes, ContactMessageCreationAttributes>
  implements ContactMessageAttributes
{
  declare id: string;
  declare user_id: string | null;
  declare name: string;
  declare email: string;
  declare subject: string;
  declare message: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export default (sequelize: Sequelize): typeof ContactMessage => {
  ContactMessage.init(
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
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: { isEmail: true },
      },
      subject: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'contact_messages',
      underscored: true,
    }
  );

  return ContactMessage;
};
