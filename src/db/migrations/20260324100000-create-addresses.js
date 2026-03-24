'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('addresses', {
      id:            { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      user_id:       { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      label:         { type: Sequelize.STRING(50), allowNull: false, defaultValue: 'Home' },
      address_line1: { type: Sequelize.STRING(255), allowNull: false },
      address_line2: { type: Sequelize.STRING(255), allowNull: true },
      city:          { type: Sequelize.STRING(100), allowNull: false },
      state:         { type: Sequelize.STRING(100), allowNull: false },
      postal_code:   { type: Sequelize.STRING(20), allowNull: false },
      country:       { type: Sequelize.STRING(100), allowNull: false, defaultValue: 'India' },
      is_default:    { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      lat:           { type: Sequelize.FLOAT, allowNull: true },
      lng:           { type: Sequelize.FLOAT, allowNull: true },
      created_at:    { type: Sequelize.DATE, allowNull: false },
      updated_at:    { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('addresses', ['user_id']);
    await queryInterface.addIndex('addresses', ['is_default']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('addresses');
  },
};
