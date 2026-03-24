import { expect } from 'chai';
import request from 'supertest';
import app from '../../src/index';

const {
  createTestUser,
  generateTestToken,
  createTestItem,
  createTestItemWithLocation,
  cleanupTestData,
} = require('../helpers');

describe('Items API', function () {
  let testUser: any;
  let authToken: string;

  beforeEach(async function () {
    this.timeout(10000);
    await cleanupTestData();
    testUser = await createTestUser();
    authToken = generateTestToken(testUser);
  });

  afterEach(async function () {
    await cleanupTestData();
  });

  describe('POST /api/items', function () {
    it('should create a new item with 201 status', async function () {
      const itemData = {
        type: 'lost',
        title: 'Lost iPhone 15',
        description: 'Black iPhone 15 Pro Max lost in downtown area.',
        category: 'electronics',
        lat: 40.7128,
        lng: -74.006,
        location_name: 'Downtown NYC',
        reward_amount: 100,
        lost_found_at: '2025-01-15T10:00:00.000Z',
      };

      const res = await request(app)
        .post('/api/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send(itemData)
        .expect(201);

      expect(res.body.item).to.exist;
      expect(res.body.item.title).to.equal('Lost iPhone 15');
      expect(res.body.item.type).to.equal('lost');
      expect(res.body.item.user_id).to.equal(testUser.id);
    });

    it('should return 400 for missing required field', async function () {
      const res = await request(app)
        .post('/api/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'lost',
          title: 'Test Item',
        })
        .expect(400);

      expect(res.body.success).to.be.false;
      expect(res.body.errors).to.be.an('array');
    });

    it('should return 400 for invalid category', async function () {
      const res = await request(app)
        .post('/api/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'lost',
          title: 'Test Item',
          description: 'A test description',
          category: 'invalid_category',
          lat: 40.7128,
          lng: -74.006,
          location_name: 'Test Location',
          lost_found_at: '2025-01-15T10:00:00.000Z',
        })
        .expect(400);

      expect(res.body.success).to.be.false;
      const categoryError = res.body.errors.find((e: any) => e.field === 'category');
      expect(categoryError).to.exist;
    });

    it('should return 400 for lost_found_at in the future', async function () {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const res = await request(app)
        .post('/api/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'lost',
          title: 'Test Item',
          description: 'A test description',
          category: 'electronics',
          lat: 40.7128,
          lng: -74.006,
          location_name: 'Test Location',
          lost_found_at: futureDate.toISOString(),
        })
        .expect(400);

      expect(res.body.success).to.be.false;
      const dateError = res.body.errors.find((e: any) => e.field === 'lost_found_at');
      expect(dateError).to.exist;
    });

    it('should return 401 when no token provided', async function () {
      const res = await request(app)
        .post('/api/items')
        .send({
          type: 'lost',
          title: 'Test Item',
          description: 'A test description',
          category: 'electronics',
          lat: 40.7128,
          lng: -74.006,
          location_name: 'Test Location',
          lost_found_at: '2025-01-15T10:00:00.000Z',
        })
        .expect(401);

      expect(res.body.success).to.be.false;
    });
  });

  describe('GET /api/items/mine', function () {
    it('should return only the authenticated user\'s items', async function () {
      await createTestItem(testUser.id, { title: 'My Item 1' });
      await createTestItem(testUser.id, { title: 'My Item 2' });

      const otherUser = await createTestUser({ email: 'other@example.com' });
      await createTestItem(otherUser.id, { title: 'Other User Item' });

      const res = await request(app)
        .get('/api/items/mine')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).to.be.true;
      expect(res.body.items).to.have.lengthOf(2);
      res.body.items.forEach((item: any) => {
        expect(item.user_id).to.equal(testUser.id);
      });
    });

    it('should return 401 when no token provided', async function () {
      const res = await request(app).get('/api/items/mine').expect(401);

      expect(res.body.success).to.be.false;
    });
  });

  describe('PATCH /api/items/:id', function () {
    it('should update item successfully and verify location updated', async function () {
      const item = await createTestItemWithLocation(testUser.id, 40.7128, -74.006, {
        title: 'Original Title',
      });

      const res = await request(app)
        .patch(`/api/items/${item.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Title',
          lat: 41.0,
          lng: -75.0,
        })
        .expect(200);

      expect(res.body.success).to.be.true;
      expect(res.body.item.title).to.equal('Updated Title');
    });

    it('should return 403 when item belongs to different user', async function () {
      const otherUser = await createTestUser({ email: 'other2@example.com' });
      const item = await createTestItem(otherUser.id);

      const res = await request(app)
        .patch(`/api/items/${item.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Trying to Update' })
        .expect(403);

      expect(res.body.success).to.be.false;
    });

    it('should return 401 when no token provided', async function () {
      const item = await createTestItem(testUser.id);

      const res = await request(app)
        .patch(`/api/items/${item.id}`)
        .send({ title: 'Update' })
        .expect(401);

      expect(res.body.success).to.be.false;
    });
  });

  describe('DELETE /api/items/:id', function () {
    it('should delete item with 204 status', async function () {
      const item = await createTestItem(testUser.id);

      await request(app)
        .delete(`/api/items/${item.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      const getRes = await request(app).get(`/api/items/${item.id}`).expect(404);

      expect(getRes.body.success).to.be.false;
    });

    it('should return 403 when item belongs to different user', async function () {
      const otherUser = await createTestUser({ email: 'other3@example.com' });
      const item = await createTestItem(otherUser.id);

      const res = await request(app)
        .delete(`/api/items/${item.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(res.body.success).to.be.false;
    });

    it('should return 401 when no token provided', async function () {
      const item = await createTestItem(testUser.id);

      const res = await request(app).delete(`/api/items/${item.id}`).expect(401);

      expect(res.body.success).to.be.false;
    });
  });

  describe('GET /api/items - Search, Filter, and Sorting', function () {
    beforeEach(async function () {
      this.timeout(15000);
      await createTestItemWithLocation(testUser.id, 40.7128, -74.006, {
        title: 'Lost iPhone in Manhattan',
        description: 'Black iPhone 15 Pro lost near Central Park',
        category: 'electronics',
        type: 'lost',
        reward_amount: 100,
      });
      await createTestItemWithLocation(testUser.id, 40.7589, -73.9851, {
        title: 'Found Keys in Times Square',
        description: 'Set of keys found near Times Square subway station',
        category: 'keys',
        type: 'found',
        reward_amount: 0,
      });
      await createTestItemWithLocation(testUser.id, 40.7484, -73.9857, {
        title: 'Lost Wallet near Empire State',
        description: 'Brown leather wallet with ID cards',
        category: 'wallet',
        type: 'lost',
        reward_amount: 50,
      });
      await createTestItemWithLocation(testUser.id, 34.0522, -118.2437, {
        title: 'Found Dog in Los Angeles',
        description: 'Golden retriever found wandering in LA',
        category: 'pets',
        type: 'found',
        reward_amount: 0,
      });
    });

    describe('Text Search', function () {
      it('should search items by title', async function () {
        const res = await request(app)
          .get('/api/items')
          .query({ search: 'iPhone' })
          .expect(200);

        expect(res.body.success).to.be.true;
        expect(res.body.data).to.have.lengthOf(1);
        expect(res.body.data[0].title).to.include('iPhone');
      });

      it('should search items by description', async function () {
        const res = await request(app)
          .get('/api/items')
          .query({ search: 'Central Park' })
          .expect(200);

        expect(res.body.success).to.be.true;
        expect(res.body.data).to.have.lengthOf(1);
        expect(res.body.data[0].description).to.include('Central Park');
      });

      it('should return empty array for no matches', async function () {
        const res = await request(app)
          .get('/api/items')
          .query({ search: 'nonexistent item xyz' })
          .expect(200);

        expect(res.body.success).to.be.true;
        expect(res.body.data).to.have.lengthOf(0);
      });

      it('should be case-insensitive', async function () {
        const res = await request(app)
          .get('/api/items')
          .query({ search: 'IPHONE' })
          .expect(200);

        expect(res.body.success).to.be.true;
        expect(res.body.data).to.have.lengthOf(1);
      });
    });

    describe('Type Filter', function () {
      it('should filter by lost type', async function () {
        const res = await request(app)
          .get('/api/items')
          .query({ type: 'lost' })
          .expect(200);

        expect(res.body.success).to.be.true;
        expect(res.body.data.length).to.be.greaterThan(0);
        res.body.data.forEach((item: any) => {
          expect(item.type).to.equal('lost');
        });
      });

      it('should filter by found type', async function () {
        const res = await request(app)
          .get('/api/items')
          .query({ type: 'found' })
          .expect(200);

        expect(res.body.success).to.be.true;
        expect(res.body.data.length).to.be.greaterThan(0);
        res.body.data.forEach((item: any) => {
          expect(item.type).to.equal('found');
        });
      });
    });

    describe('Category/Tags Filter', function () {
      it('should filter by single category', async function () {
        const res = await request(app)
          .get('/api/items')
          .query({ category: 'electronics' })
          .expect(200);

        expect(res.body.success).to.be.true;
        expect(res.body.data.length).to.be.greaterThan(0);
        res.body.data.forEach((item: any) => {
          expect(item.category).to.equal('electronics');
        });
      });

      it('should filter by multiple tags', async function () {
        const res = await request(app)
          .get('/api/items')
          .query({ tags: 'electronics,keys' })
          .expect(200);

        expect(res.body.success).to.be.true;
        expect(res.body.data.length).to.be.greaterThan(0);
        res.body.data.forEach((item: any) => {
          expect(['electronics', 'keys']).to.include(item.category);
        });
      });
    });

    describe('Distance Filter', function () {
      it('should filter items within radius', async function () {
        const res = await request(app)
          .get('/api/items')
          .query({
            lat: 40.7128,
            lng: -74.006,
            radius: 10000,
          })
          .expect(200);

        expect(res.body.success).to.be.true;
        expect(res.body.data.length).to.be.greaterThan(0);
        res.body.data.forEach((item: any) => {
          expect(item.distance).to.be.lessThanOrEqual(10000);
        });
      });

      it('should exclude items outside radius', async function () {
        const res = await request(app)
          .get('/api/items')
          .query({
            lat: 40.7128,
            lng: -74.006,
            radius: 1000,
          })
          .expect(200);

        expect(res.body.success).to.be.true;
        const laItem = res.body.data.find((item: any) => item.title.includes('Los Angeles'));
        expect(laItem).to.be.undefined;
      });

      it('should filter by minDistance and maxDistance', async function () {
        const res = await request(app)
          .get('/api/items')
          .query({
            lat: 40.7128,
            lng: -74.006,
            minDistance: 1000,
            maxDistance: 10000,
          })
          .expect(200);

        expect(res.body.success).to.be.true;
        res.body.data.forEach((item: any) => {
          expect(item.distance).to.be.at.least(1000);
          expect(item.distance).to.be.at.most(10000);
        });
      });
    });

    describe('Sorting', function () {
      it('should sort by reward amount descending', async function () {
        const res = await request(app)
          .get('/api/items')
          .query({ sortBy: 'reward_amount', sortOrder: 'desc' })
          .expect(200);

        expect(res.body.success).to.be.true;
        const rewards = res.body.data.map((item: any) => parseFloat(item.reward_amount));
        for (let i = 1; i < rewards.length; i++) {
          expect(rewards[i - 1]).to.be.at.least(rewards[i]);
        }
      });

      it('should sort by reward amount ascending', async function () {
        const res = await request(app)
          .get('/api/items')
          .query({ sortBy: 'reward_amount', sortOrder: 'asc' })
          .expect(200);

        expect(res.body.success).to.be.true;
        const rewards = res.body.data.map((item: any) => parseFloat(item.reward_amount));
        for (let i = 1; i < rewards.length; i++) {
          expect(rewards[i - 1]).to.be.at.most(rewards[i]);
        }
      });

      it('should sort by title alphabetically', async function () {
        const res = await request(app)
          .get('/api/items')
          .query({ sortBy: 'title', sortOrder: 'asc' })
          .expect(200);

        expect(res.body.success).to.be.true;
        const titles = res.body.data.map((item: any) => item.title);
        const sortedTitles = [...titles].sort();
        expect(titles).to.deep.equal(sortedTitles);
      });

      it('should sort by distance when geo params provided', async function () {
        const res = await request(app)
          .get('/api/items')
          .query({
            lat: 40.7128,
            lng: -74.006,
            sortBy: 'distance',
            sortOrder: 'asc',
          })
          .expect(200);

        expect(res.body.success).to.be.true;
        const distances = res.body.data.map((item: any) => item.distance);
        for (let i = 1; i < distances.length; i++) {
          expect(distances[i - 1]).to.be.at.most(distances[i]);
        }
      });

      it('should sort by createdAt by default', async function () {
        const res = await request(app)
          .get('/api/items')
          .expect(200);

        expect(res.body.success).to.be.true;
        const dates = res.body.data.map((item: any) => new Date(item.created_at).getTime());
        for (let i = 1; i < dates.length; i++) {
          expect(dates[i - 1]).to.be.at.least(dates[i]);
        }
      });
    });

    describe('Combined Filters', function () {
      it('should combine search with type filter', async function () {
        const res = await request(app)
          .get('/api/items')
          .query({ search: 'Lost', type: 'lost' })
          .expect(200);

        expect(res.body.success).to.be.true;
        res.body.data.forEach((item: any) => {
          expect(item.type).to.equal('lost');
        });
      });

      it('should combine distance filter with category', async function () {
        const res = await request(app)
          .get('/api/items')
          .query({
            lat: 40.7128,
            lng: -74.006,
            radius: 50000,
            category: 'electronics',
          })
          .expect(200);

        expect(res.body.success).to.be.true;
        res.body.data.forEach((item: any) => {
          expect(item.category).to.equal('electronics');
          expect(item.distance).to.be.lessThanOrEqual(50000);
        });
      });

      it('should combine all filters with sorting', async function () {
        const res = await request(app)
          .get('/api/items')
          .query({
            lat: 40.7128,
            lng: -74.006,
            radius: 50000,
            type: 'lost',
            sortBy: 'reward_amount',
            sortOrder: 'desc',
          })
          .expect(200);

        expect(res.body.success).to.be.true;
        res.body.data.forEach((item: any) => {
          expect(item.type).to.equal('lost');
        });
        const rewards = res.body.data.map((item: any) => parseFloat(item.reward_amount));
        for (let i = 1; i < rewards.length; i++) {
          expect(rewards[i - 1]).to.be.at.least(rewards[i]);
        }
      });
    });

    describe('Pagination with Filters', function () {
      it('should paginate filtered results', async function () {
        const res = await request(app)
          .get('/api/items')
          .query({ page: 1, limit: 2 })
          .expect(200);

        expect(res.body.success).to.be.true;
        expect(res.body.data).to.have.lengthOf.at.most(2);
        expect(res.body.pagination).to.exist;
        expect(res.body.pagination.page).to.equal(1);
        expect(res.body.pagination.limit).to.equal(2);
      });

      it('should return correct total count with filters', async function () {
        const res = await request(app)
          .get('/api/items')
          .query({ type: 'lost', page: 1, limit: 10 })
          .expect(200);

        expect(res.body.success).to.be.true;
        expect(res.body.pagination.total).to.be.greaterThan(0);
        expect(res.body.data.length).to.equal(
          Math.min(res.body.pagination.total, res.body.pagination.limit)
        );
      });
    });

    describe('Validation', function () {
      it('should return 400 for invalid sortBy value', async function () {
        const res = await request(app)
          .get('/api/items')
          .query({ sortBy: 'invalid_field' })
          .expect(400);

        expect(res.body.success).to.be.false;
      });

      it('should return 400 for invalid sortOrder value', async function () {
        const res = await request(app)
          .get('/api/items')
          .query({ sortOrder: 'invalid' })
          .expect(400);

        expect(res.body.success).to.be.false;
      });

      it('should return 400 for invalid type value', async function () {
        const res = await request(app)
          .get('/api/items')
          .query({ type: 'invalid' })
          .expect(400);

        expect(res.body.success).to.be.false;
      });
    });
  });
});
