'use strict';
// Phase 1: reward record only — no payment processing.
// Phase 2 will add stripe_payment_id, stripe_transfer_id, payout fields.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('rewards', {
      id:         { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      item_id:    { type: Sequelize.UUID, allowNull: false, unique: true, references: { model: 'items', key: 'id' }, onDelete: 'CASCADE' },
      payer_id:   { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      payee_id:   { type: Sequelize.UUID, references: { model: 'users', key: 'id' } }, // set when claim accepted
      amount:     { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      status:     { type: Sequelize.ENUM('pending', 'released', 'cancelled'), defaultValue: 'pending' },
      // phase2_stripe_payment_id  ← add in future migration
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('rewards');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_rewards_status";');
  },
};