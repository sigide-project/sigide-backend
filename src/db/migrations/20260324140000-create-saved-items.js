'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('saved_items', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      item_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'items',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Add unique constraint to prevent duplicate saves
    await queryInterface.addIndex('saved_items', ['user_id', 'item_id'], {
      unique: true,
      name: 'saved_items_user_item_unique',
    });

    // Add index for faster lookups by user
    await queryInterface.addIndex('saved_items', ['user_id'], {
      name: 'saved_items_user_id_idx',
    });

    // Add index for faster lookups by item
    await queryInterface.addIndex('saved_items', ['item_id'], {
      name: 'saved_items_item_id_idx',
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('saved_items');
  },
};
