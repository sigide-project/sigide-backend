'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('chat_deletions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },
      claim_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'claims',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    await queryInterface.addConstraint('chat_deletions', {
      fields: ['claim_id', 'user_id'],
      type: 'unique',
      name: 'unique_chat_deletion_per_user',
    });

    await queryInterface.addIndex('chat_deletions', ['user_id'], {
      name: 'idx_chat_deletions_user_id',
    });

    await queryInterface.addIndex('chat_deletions', ['claim_id'], {
      name: 'idx_chat_deletions_claim_id',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('chat_deletions');
  },
};
