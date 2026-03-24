'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id:         { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      name:       { type: Sequelize.STRING(100), allowNull: false },
      email:      { type: Sequelize.STRING(255), allowNull: false, unique: true },
      phone:      { type: Sequelize.STRING(20) },
      password_hash: { type: Sequelize.STRING(255), allowNull: false },
      avatar_url: { type: Sequelize.TEXT },
      rating:     { type: Sequelize.FLOAT, defaultValue: 0 },
      role:       { type: Sequelize.ENUM('user', 'admin'), defaultValue: 'user' },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('users');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_role";');
  },
};