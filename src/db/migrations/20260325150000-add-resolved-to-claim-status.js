'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_claims_status" ADD VALUE IF NOT EXISTS 'resolved';
    `);
  },

  async down(queryInterface) {
    // PostgreSQL doesn't support removing values from enums easily
    // This would require recreating the enum and updating all references
    // For safety, we leave this as a no-op
    console.log('Note: Removing enum values is not supported. Manual intervention required if rollback is needed.');
  },
};
