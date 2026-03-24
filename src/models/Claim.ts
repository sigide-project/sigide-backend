import { DataTypes, Model, Sequelize } from 'sequelize';
import { ClaimAttributes, ClaimCreationAttributes, ClaimStatus } from '../types';

export class Claim extends Model<ClaimAttributes, ClaimCreationAttributes> implements ClaimAttributes {
  declare id: string;
  declare item_id: string;
  declare claimant_id: string;
  declare status: ClaimStatus;
  declare proof_description: string | null;
  declare proof_images: string[];
  declare resolved_at: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export default (sequelize: Sequelize): typeof Claim => {
  Claim.init(
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
      claimant_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'disputed'),
        defaultValue: 'pending',
      },
      proof_description: {
        type: DataTypes.TEXT,
      },
      proof_images: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        defaultValue: [],
      },
      resolved_at: {
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      tableName: 'claims',
      underscored: true,
    }
  );

  return Claim;
};
