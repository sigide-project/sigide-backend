'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('claims', {
      id:                  { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      item_id:             { type: Sequelize.UUID, allowNull: false, references: { model: 'items', key: 'id' }, onDelete: 'CASCADE' },
      claimant_id:         { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      status:              { type: Sequelize.ENUM('pending', 'accepted', 'rejected', 'disputed'), defaultValue: 'pending' },
      proof_description:   { type: Sequelize.TEXT },
      proof_images:        { type: Sequelize.ARRAY(Sequelize.TEXT), defaultValue: [] },
      resolved_at:         { type: Sequelize.DATE },
      created_at:          { type: Sequelize.DATE, allowNull: false },
      updated_at:          { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('claims', ['item_id']);
    await queryInterface.addIndex('claims', ['claimant_id']);
    await queryInterface.addIndex('claims', ['status']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('claims');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_claims_status";');
  },
};