'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'username', {
      type: Sequelize.STRING(50),
      allowNull: true,
      unique: true,
    });

    // Set default username to user id for existing users
    await queryInterface.sequelize.query(`
      UPDATE users SET username = id WHERE username IS NULL;
    `);

    // Now make the column not null
    await queryInterface.changeColumn('users', 'username', {
      type: Sequelize.STRING(50),
      allowNull: false,
      unique: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'username');
  },
};
