const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { User, Item, sequelize } = require('../src/models');

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

async function createTestUser(overrides = {}) {
  const password_hash = await bcrypt.hash('password123', 10);
  const userData = {
    email: `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,
    password_hash,
    name: 'Test User',
    ...overrides,
  };

  const user = await User.create(userData);
  return user;
}

function generateTestToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '1d' }
  );
}

async function createTestItem(userId, overrides = {}) {
  const itemData = {
    user_id: userId,
    type: 'lost',
    title: 'Test Lost Item',
    description: 'This is a test lost item description that is long enough.',
    category: 'electronics',
    location_name: 'Test Location',
    lost_found_at: new Date('2025-01-01'),
    status: 'open',
    ...overrides,
  };

  const item = await Item.create(itemData);
  return item;
}

async function createTestItemWithLocation(userId, lat, lng, overrides = {}) {
  const itemData = {
    user_id: userId,
    type: 'lost',
    title: 'Test Item with Location',
    description: 'This is a test item with a geographic location.',
    category: 'electronics',
    location_name: 'Test Location',
    lost_found_at: new Date('2025-01-01'),
    status: 'open',
    ...overrides,
  };

  const item = await Item.create(itemData);

  await sequelize.query(
    `UPDATE items SET location = ST_SetSRID(ST_MakePoint(:lng, :lat), 4326) WHERE id = :id`,
    {
      replacements: { lng, lat, id: item.id },
    }
  );

  return item;
}

async function cleanupTestData() {
  await Item.destroy({ where: {}, force: true });
  await User.destroy({ where: {}, force: true });
}

module.exports = {
  createTestUser,
  generateTestToken,
  createTestItem,
  createTestItemWithLocation,
  cleanupTestData,
};
