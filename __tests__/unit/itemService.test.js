const { expect } = require('chai');
const sinon = require('sinon');
const itemService = require('../../src/services/itemService');
const { Item, User } = require('../../src/models');
const {
  createTestUser,
  createTestItem,
  createTestItemWithLocation,
  cleanupTestData,
} = require('../helpers');

describe('ItemService', function() {
  let testUser;

  beforeEach(async function() {
    await cleanupTestData();
    testUser = await createTestUser();
  });

  afterEach(async function() {
    await cleanupTestData();
    sinon.restore();
  });

  describe('create', function() {
    it('should create an item with basic data', async function() {
      const itemData = {
        type: 'lost',
        title: 'Lost Wallet',
        description: 'Brown leather wallet with cards.',
        category: 'accessories',
      };

      const item = await itemService.create(itemData, testUser.id);

      expect(item).to.exist;
      expect(item.title).to.equal('Lost Wallet');
      expect(item.userId).to.equal(testUser.id);
      expect(item.status).to.equal('active');
    });

    it('should create an item with location', async function() {
      const itemData = {
        type: 'found',
        title: 'Found Phone',
        description: 'iPhone found at the park.',
        category: 'electronics',
        lat: 40.7128,
        lng: -74.0060,
      };

      const item = await itemService.create(itemData, testUser.id);

      expect(item).to.exist;
      expect(item.location).to.exist;
      expect(item.location.coordinates).to.deep.equal([-74.0060, 40.7128]);
    });

    it('should create an item with reward amount', async function() {
      const itemData = {
        type: 'lost',
        title: 'Lost Ring',
        description: 'Engagement ring, very sentimental value.',
        category: 'jewelry',
        rewardAmount: 500,
      };

      const item = await itemService.create(itemData, testUser.id);

      expect(item).to.exist;
      expect(parseFloat(item.rewardAmount)).to.equal(500);
    });
  });

  describe('findById', function() {
    it('should find an item by id with user info', async function() {
      const createdItem = await createTestItem(testUser.id);

      const item = await itemService.findById(createdItem.id);

      expect(item).to.exist;
      expect(item.id).to.equal(createdItem.id);
      expect(item.user).to.exist;
      expect(item.user.firstName).to.equal(testUser.firstName);
    });

    it('should return null for non-existent id', async function() {
      const item = await itemService.findById('00000000-0000-0000-0000-000000000000');

      expect(item).to.be.null;
    });
  });

  describe('findAll', function() {
    it('should return paginated items', async function() {
      for (let i = 0; i < 5; i++) {
        await createTestItem(testUser.id, { title: `Item ${i}` });
      }

      const result = await itemService.findAll({ page: 1, limit: 2 });

      expect(result.items).to.have.lengthOf(2);
      expect(result.pagination.total).to.equal(5);
      expect(result.pagination.totalPages).to.equal(3);
    });

    it('should filter by type', async function() {
      await createTestItem(testUser.id, { type: 'lost' });
      await createTestItem(testUser.id, { type: 'found' });
      await createTestItem(testUser.id, { type: 'lost' });

      const result = await itemService.findAll({ type: 'found' });

      expect(result.items).to.have.lengthOf(1);
      expect(result.items[0].type).to.equal('found');
    });

    it('should filter by category', async function() {
      await createTestItem(testUser.id, { category: 'electronics' });
      await createTestItem(testUser.id, { category: 'documents' });

      const result = await itemService.findAll({ category: 'documents' });

      expect(result.items).to.have.lengthOf(1);
      expect(result.items[0].category).to.equal('documents');
    });

    it('should only return active items by default', async function() {
      await createTestItem(testUser.id, { status: 'active' });
      await createTestItem(testUser.id, { status: 'resolved' });
      await createTestItem(testUser.id, { status: 'cancelled' });

      const result = await itemService.findAll({});

      expect(result.items).to.have.lengthOf(1);
      expect(result.items[0].status).to.equal('active');
    });
  });

  describe('findByUser', function() {
    it('should return items for a specific user', async function() {
      await createTestItem(testUser.id);
      await createTestItem(testUser.id);

      const otherUser = await createTestUser({ email: 'other@test.com' });
      await createTestItem(otherUser.id);

      const result = await itemService.findByUser(testUser.id);

      expect(result.items).to.have.lengthOf(2);
      result.items.forEach(item => {
        expect(item.userId).to.equal(testUser.id);
      });
    });

    it('should filter user items by type', async function() {
      await createTestItem(testUser.id, { type: 'lost' });
      await createTestItem(testUser.id, { type: 'found' });

      const result = await itemService.findByUser(testUser.id, { type: 'lost' });

      expect(result.items).to.have.lengthOf(1);
      expect(result.items[0].type).to.equal('lost');
    });
  });

  describe('update', function() {
    it('should update an item owned by the user', async function() {
      const item = await createTestItem(testUser.id, { title: 'Old Title' });

      const updated = await itemService.update(item.id, testUser.id, {
        title: 'New Title',
        description: 'Updated description that is long enough.',
      });

      expect(updated).to.exist;
      expect(updated.title).to.equal('New Title');
    });

    it('should return null when updating item owned by another user', async function() {
      const otherUser = await createTestUser({ email: 'owner@test.com' });
      const item = await createTestItem(otherUser.id);

      const updated = await itemService.update(item.id, testUser.id, {
        title: 'Hacked Title',
      });

      expect(updated).to.be.null;
    });

    it('should update location when lat/lng provided', async function() {
      const item = await createTestItem(testUser.id);

      const updated = await itemService.update(item.id, testUser.id, {
        lat: 51.5074,
        lng: -0.1278,
      });

      expect(updated.location).to.exist;
      expect(updated.location.coordinates).to.deep.equal([-0.1278, 51.5074]);
    });
  });

  describe('resolve', function() {
    it('should mark item as resolved', async function() {
      const item = await createTestItem(testUser.id);

      const resolved = await itemService.resolve(item.id, testUser.id);

      expect(resolved).to.exist;
      expect(resolved.status).to.equal('resolved');
    });

    it('should return null for item not owned by user', async function() {
      const otherUser = await createTestUser({ email: 'owner2@test.com' });
      const item = await createTestItem(otherUser.id);

      const resolved = await itemService.resolve(item.id, testUser.id);

      expect(resolved).to.be.null;
    });
  });

  describe('delete', function() {
    it('should soft delete item by setting status to cancelled', async function() {
      const item = await createTestItem(testUser.id);

      const deleted = await itemService.delete(item.id, testUser.id);

      expect(deleted).to.be.true;

      const found = await itemService.findById(item.id);
      expect(found.status).to.equal('cancelled');
    });

    it('should return false for item not owned by user', async function() {
      const otherUser = await createTestUser({ email: 'owner3@test.com' });
      const item = await createTestItem(otherUser.id);

      const deleted = await itemService.delete(item.id, testUser.id);

      expect(deleted).to.be.false;
    });
  });
});
