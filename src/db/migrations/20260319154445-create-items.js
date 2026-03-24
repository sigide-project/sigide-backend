'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    // Enable PostGIS if not already enabled
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS postgis;');

    await queryInterface.createTable('items', {
      id:            { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      user_id:       { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      type:          { type: Sequelize.ENUM('lost', 'found'), allowNull: false },
      status:        { type: Sequelize.ENUM('open', 'claimed', 'resolved'), defaultValue: 'open' },
      title:         { type: Sequelize.STRING(200), allowNull: false },
      description:   { type: Sequelize.TEXT },
      category:      { type: Sequelize.STRING(50) },       // e.g. phone, wallet, pet, document
      image_urls:    { type: Sequelize.ARRAY(Sequelize.TEXT), defaultValue: [] },
      location_name: { type: Sequelize.STRING(255) },      // human-readable area name
      reward_amount: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 }, // display only, phase 1
      lost_found_at: { type: Sequelize.DATE },
      created_at:    { type: Sequelize.DATE, allowNull: false },
      updated_at:    { type: Sequelize.DATE, allowNull: false },
    });

    // Add PostGIS geometry column separately (Sequelize doesn't support it natively)
    await queryInterface.sequelize.query(`
      ALTER TABLE items
      ADD COLUMN location GEOMETRY(Point, 4326);
    `);

    // Spatial index for fast geo queries
    await queryInterface.sequelize.query(`
      CREATE INDEX idx_items_location ON items USING GIST (location);
    `);

    await queryInterface.addIndex('items', ['type']);
    await queryInterface.addIndex('items', ['status']);
    await queryInterface.addIndex('items', ['category']);
    await queryInterface.addIndex('items', ['user_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('items');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_items_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_items_status";');
  },
};