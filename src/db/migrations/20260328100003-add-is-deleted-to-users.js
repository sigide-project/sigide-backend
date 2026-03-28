'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'is_deleted', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.addIndex('users', ['is_deleted'], {
      name: 'idx_users_is_deleted',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'is_deleted');
  },
};
