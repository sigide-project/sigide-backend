import { expect } from 'chai';
import request from 'supertest';
import app from '../../src/index';

const { createTestUser, generateTestToken, cleanupTestData } = require('../helpers');

describe('Users API', function () {
  let testUser: any;
  let authToken: string;

  beforeEach(async function () {
    this.timeout(10000);
    await cleanupTestData();
    testUser = await createTestUser({ name: 'Original Name' });
    authToken = generateTestToken(testUser);
  });

  afterEach(async function () {
    await cleanupTestData();
  });

  describe('PATCH /api/users/me', function () {
    it('should update name successfully', async function () {
      const res = await request(app)
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(res.body.user).to.exist;
      expect(res.body.user.name).to.equal('Updated Name');
      expect(res.body.user.id).to.equal(testUser.id);
      expect(res.body.user.email).to.equal(testUser.email);
      expect(res.body.user).to.not.have.property('password_hash');
    });

    it('should update phone successfully', async function () {
      const res = await request(app)
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ phone: '1234567890' })
        .expect(200);

      expect(res.body.user.phone).to.equal('1234567890');
    });

    it('should update avatar_url successfully', async function () {
      const res = await request(app)
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ avatar_url: 'https://example.com/avatar.jpg' })
        .expect(200);

      expect(res.body.user.avatar_url).to.equal('https://example.com/avatar.jpg');
    });

    it('should silently ignore email in body', async function () {
      const originalEmail = testUser.email;

      const res = await request(app)
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'New Name',
          email: 'newemail@example.com',
        })
        .expect(200);

      expect(res.body.user.name).to.equal('New Name');
      expect(res.body.user.email).to.equal(originalEmail);
    });

    it('should return 401 when no token provided', async function () {
      const res = await request(app)
        .patch('/api/users/me')
        .send({ name: 'New Name' })
        .expect(401);

      expect(res.body.success).to.be.false;
    });

    it('should return 400 for invalid name (too short)', async function () {
      const res = await request(app)
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'A' })
        .expect(400);

      expect(res.body.success).to.be.false;
    });

    it('should return 400 for invalid avatar_url', async function () {
      const res = await request(app)
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ avatar_url: 'not-a-valid-url' })
        .expect(400);

      expect(res.body.success).to.be.false;
    });

    it('should return user with correct fields', async function () {
      const res = await request(app)
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test' })
        .expect(200);

      expect(res.body.user).to.have.all.keys([
        'id',
        'name',
        'email',
        'phone',
        'avatar_url',
        'rating',
        'role',
      ]);
    });
  });
});
