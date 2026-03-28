'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('feedback', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      rating: {
        type: Sequelize.SMALLINT,
        allowNull: true,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      feedback: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE feedback
      ADD CONSTRAINT chk_feedback_rating
      CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5))
    `);

    await queryInterface.addIndex('feedback', ['user_id'], {
      name: 'idx_feedback_user_id',
    });
    await queryInterface.addIndex('feedback', ['rating'], {
      name: 'idx_feedback_rating',
    });
    await queryInterface.addIndex('feedback', ['created_at'], {
      name: 'idx_feedback_created_at',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('feedback');
  },
};
