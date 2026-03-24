'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notifications', {
      id:         { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      user_id:    { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      type:       { type: Sequelize.STRING(50), allowNull: false }, // e.g. 'claim_received', 'claim_accepted'
      payload:    { type: Sequelize.JSONB, defaultValue: {} },      // flexible data per notification type
      read:       { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('notifications', ['user_id']);
    await queryInterface.addIndex('notifications', ['read']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('notifications');
  },
};