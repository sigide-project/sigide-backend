const { expect } = require('chai');
const request = require('supertest');
const app = require('../../src/index');
const { 
  createTestUser, 
  generateTestToken, 
  createTestItem,
  createTestItemWithLocation,
  cleanupTestData 
} = require('../helpers');

describe('Items API', function() {
  let testUser;
  let authToken;

  beforeEach(async function() {
    await cleanupTestData();
    testUser = await createTestUser();
    authToken = generateTestToken(testUser);
  });

  afterEach(async function() {
    await cleanupTestData();
  });

  describe('GET /api/items', function() {
    it('should return empty array when no items exist', async function() {
      const res = await request(app)
        .get('/api/items')
        .expect(200);

      expect(res.body.success).to.be.true;
      expect(res.body.data).to.be.an('array').that.is.empty;
      expect(res.body.pagination).to.exist;
      expect(res.body.pagination.total).to.equal(0);
    });

    it('should return all active items', async function() {
      await createTestItem(testUser.id, { title: 'Lost Phone' });
      await createTestItem(testUser.id, { title: 'Lost Wallet', type: 'found' });

      const res = await request(app)
        .get('/api/items')
        .expect(200);

      expect(res.body.success).to.be.true;
      expect(res.body.data).to.be.an('array').with.lengthOf(2);
      expect(res.body.pagination.total).to.equal(2);
    });

    it('should filter items by type', async function() {
      await createTestItem(testUser.id, { type: 'lost' });
      await createTestItem(testUser.id, { type: 'found' });
      await createTestItem(testUser.id, { type: 'lost' });

      const res = await request(app)
        .get('/api/items')
        .query({ type: 'lost' })
        .expect(200);

      expect(res.body.success).to.be.true;
      expect(res.body.data).to.be.an('array').with.lengthOf(2);
      res.body.data.forEach(item => {
        expect(item.type).to.equal('lost');
      });
    });

    it('should filter items by category', async function() {
      await createTestItem(testUser.id, { category: 'electronics' });
      await createTestItem(testUser.id, { category: 'documents' });
      await createTestItem(testUser.id, { category: 'electronics' });

      const res = await request(app)
        .get('/api/items')
        .query({ category: 'electronics' })
        .expect(200);

      expect(res.body.success).to.be.true;
      expect(res.body.data).to.be.an('array').with.lengthOf(2);
      res.body.data.forEach(item => {
        expect(item.category).to.equal('electronics');
      });
    });

    it('should paginate results', async function() {
      for (let i = 0; i < 5; i++) {
        await createTestItem(testUser.id, { title: `Item ${i}` });
      }

      const res = await request(app)
        .get('/api/items')
        .query({ page: 1, limit: 2 })
        .expect(200);

      expect(res.body.success).to.be.true;
      expect(res.body.data).to.have.lengthOf(2);
      expect(res.body.pagination.total).to.equal(5);
      expect(res.body.pagination.totalPages).to.equal(3);
    });

    it('should filter by geographic location when lat, lng, and radius provided', async function() {
      const centerLat = 40.7128;
      const centerLng = -74.0060;

      await createTestItemWithLocation(testUser.id, centerLat, centerLng, { title: 'Nearby Item' });
      await createTestItemWithLocation(testUser.id, centerLat + 0.01, centerLng + 0.01, { title: 'Close Item' });
      await createTestItemWithLocation(testUser.id, centerLat + 1, centerLng + 1, { title: 'Far Item' });

      const res = await request(app)
        .get('/api/items')
        .query({ lat: centerLat, lng: centerLng, radius: 5 })
        .expect(200);

      expect(res.body.success).to.be.true;
      expect(res.body.data).to.be.an('array').with.lengthOf(2);
    });

    it('should return validation error for invalid type', async function() {
      const res = await request(app)
        .get('/api/items')
        .query({ type: 'invalid' })
        .expect(400);

      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('Validation failed');
    });

    it('should return validation error for invalid coordinates', async function() {
      const res = await request(app)
        .get('/api/items')
        .query({ lat: 200, lng: -74 })
        .expect(400);

      expect(res.body.success).to.be.false;
    });
  });

  describe('GET /api/items/:id', function() {
    it('should return a single item by id', async function() {
      const item = await createTestItem(testUser.id, { title: 'My Lost Phone' });

      const res = await request(app)
        .get(`/api/items/${item.id}`)
        .expect(200);

      expect(res.body.success).to.be.true;
      expect(res.body.data.id).to.equal(item.id);
      expect(res.body.data.title).to.equal('My Lost Phone');
      expect(res.body.data.user).to.exist;
    });

    it('should return 404 for non-existent item', async function() {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const res = await request(app)
        .get(`/api/items/${fakeId}`)
        .expect(404);

      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('Item not found');
    });

    it('should return validation error for invalid UUID', async function() {
      const res = await request(app)
        .get('/api/items/invalid-id')
        .expect(400);

      expect(res.body.success).to.be.false;
    });
  });

  describe('POST /api/items', function() {
    it('should create a new item when authenticated', async function() {
      const itemData = {
        type: 'lost',
        title: 'Lost iPhone 15',
        description: 'Black iPhone 15 Pro Max lost in downtown area.',
        category: 'electronics',
        lat: 40.7128,
        lng: -74.0060,
        rewardAmount: 100,
      };

      const res = await request(app)
        .post('/api/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send(itemData)
        .expect(201);

      expect(res.body.success).to.be.true;
      expect(res.body.data.title).to.equal('Lost iPhone 15');
      expect(res.body.data.type).to.equal('lost');
      expect(res.body.data.userId).to.equal(testUser.id);
      expect(res.body.data.rewardAmount).to.equal('100.00');
    });

    it('should return 401 when not authenticated', async function() {
      const itemData = {
        type: 'lost',
        title: 'Lost Item',
        description: 'Description of the lost item for testing.',
        category: 'electronics',
      };

      const res = await request(app)
        .post('/api/items')
        .send(itemData)
        .expect(401);

      expect(res.body.success).to.be.false;
      expect(res.body.message).to.include('No token');
    });

    it('should return validation error for missing required fields', async function() {
      const res = await request(app)
        .post('/api/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Test' })
        .expect(400);

      expect(res.body.success).to.be.false;
      expect(res.body.errors).to.be.an('array');
    });

    it('should return validation error for title too short', async function() {
      const res = await request(app)
        .post('/api/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'lost',
          title: 'AB',
          description: 'Valid description that is long enough.',
          category: 'electronics',
        })
        .expect(400);

      expect(res.body.success).to.be.false;
      const titleError = res.body.errors.find(e => e.field === 'title');
      expect(titleError).to.exist;
    });

    it('should create item without location', async function() {
      const itemData = {
        type: 'found',
        title: 'Found Keys',
        description: 'Set of car keys found in the parking lot.',
        category: 'keys',
      };

      const res = await request(app)
        .post('/api/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send(itemData)
        .expect(201);

      expect(res.body.success).to.be.true;
      expect(res.body.data.location).to.be.null;
    });
  });

  describe('PUT /api/items/:id', function() {
    it('should update an item owned by the user', async function() {
      const item = await createTestItem(testUser.id, { title: 'Original Title' });

      const res = await request(app)
        .put(`/api/items/${item.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated Title' })
        .expect(200);

      expect(res.body.success).to.be.true;
      expect(res.body.data.title).to.equal('Updated Title');
    });

    it('should return 404 when updating item owned by another user', async function() {
      const otherUser = await createTestUser({ email: 'other@example.com' });
      const item = await createTestItem(otherUser.id);

      const res = await request(app)
        .put(`/api/items/${item.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Trying to Update' })
        .expect(404);

      expect(res.body.success).to.be.false;
    });

    it('should return 401 when not authenticated', async function() {
      const item = await createTestItem(testUser.id);

      const res = await request(app)
        .put(`/api/items/${item.id}`)
        .send({ title: 'Update' })
        .expect(401);

      expect(res.body.success).to.be.false;
    });
  });

  describe('PATCH /api/items/:id/resolve', function() {
    it('should mark an item as resolved', async function() {
      const item = await createTestItem(testUser.id);

      const res = await request(app)
        .patch(`/api/items/${item.id}/resolve`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).to.be.true;
      expect(res.body.data.status).to.equal('resolved');
    });

    it('should return 404 for item owned by another user', async function() {
      const otherUser = await createTestUser({ email: 'other2@example.com' });
      const item = await createTestItem(otherUser.id);

      const res = await request(app)
        .patch(`/api/items/${item.id}/resolve`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(res.body.success).to.be.false;
    });
  });

  describe('DELETE /api/items/:id', function() {
    it('should soft delete an item (set status to cancelled)', async function() {
      const item = await createTestItem(testUser.id);

      const res = await request(app)
        .delete(`/api/items/${item.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).to.be.true;

      const getRes = await request(app)
        .get(`/api/items/${item.id}`)
        .expect(200);

      expect(getRes.body.data.status).to.equal('cancelled');
    });

    it('should return 404 for item owned by another user', async function() {
      const otherUser = await createTestUser({ email: 'other3@example.com' });
      const item = await createTestItem(otherUser.id);

      const res = await request(app)
        .delete(`/api/items/${item.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(res.body.success).to.be.false;
    });
  });

  describe('GET /api/items/me', function() {
    it('should return items belonging to the authenticated user', async function() {
      await createTestItem(testUser.id, { title: 'My Item 1' });
      await createTestItem(testUser.id, { title: 'My Item 2' });

      const otherUser = await createTestUser({ email: 'other4@example.com' });
      await createTestItem(otherUser.id, { title: 'Other User Item' });

      const res = await request(app)
        .get('/api/items/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).to.be.true;
      expect(res.body.data).to.have.lengthOf(2);
      res.body.data.forEach(item => {
        expect(item.userId).to.equal(testUser.id);
      });
    });

    it('should return 401 when not authenticated', async function() {
      const res = await request(app)
        .get('/api/items/me')
        .expect(401);

      expect(res.body.success).to.be.false;
    });
  });
});
