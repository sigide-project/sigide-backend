'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('messages', {
      id:        { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      claim_id:  { type: Sequelize.UUID, allowNull: false, references: { model: 'claims', key: 'id' }, onDelete: 'CASCADE' },
      sender_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      content:   { type: Sequelize.TEXT, allowNull: false },
      read_at:   { type: Sequelize.DATE },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('messages', ['claim_id']);
    await queryInterface.addIndex('messages', ['sender_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('messages');
  },
};