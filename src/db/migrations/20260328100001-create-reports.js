'use strict';

const VALID_ISSUE_TYPES = [
  'Bug or Technical Issue',
  'Suspicious User/Listing',
  'Inappropriate Content',
  'Scam or Fraud',
  'Account Issue',
  'Other',
];

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('reports', {
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
      issue_type: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      listing_url: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'open',
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

    const issueTypeValues = VALID_ISSUE_TYPES.map((t) => `'${t}'`).join(', ');
    await queryInterface.sequelize.query(`
      ALTER TABLE reports
      ADD CONSTRAINT chk_reports_issue_type
      CHECK (issue_type IN (${issueTypeValues}))
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE reports
      ADD CONSTRAINT chk_reports_status
      CHECK (status IN ('open', 'reviewing', 'resolved', 'dismissed'))
    `);

    await queryInterface.addIndex('reports', ['user_id'], {
      name: 'idx_reports_user_id',
    });
    await queryInterface.addIndex('reports', ['issue_type'], {
      name: 'idx_reports_issue_type',
    });
    await queryInterface.addIndex('reports', ['status'], {
      name: 'idx_reports_status',
    });
    await queryInterface.addIndex('reports', ['created_at'], {
      name: 'idx_reports_created_at',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('reports');
  },
};
