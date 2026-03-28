import { expect } from 'chai';
import request from 'supertest';
import app from '../../src/index';
import { User, Feedback } from '../../src/models';
import { generateToken } from '../../src/middlewares/auth';

describe('Feedback API', function () {
  this.timeout(10000);

  let testUser: User;
  let authToken: string;

  const validPayload = {
    feedback: 'This is great feedback about the platform!',
  };

  before(async function () {
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash('password123', 10);

    testUser = await User.create({
      name: 'Auth User',
      email: 'auth-feedback@example.com',
      password_hash: hashedPassword,
      rating: 0,
      role: 'user',
    });

    authToken = generateToken({ id: testUser.id, email: testUser.email });
  });

  afterEach(async function () {
    await Feedback.destroy({ where: {}, force: true });
  });

  after(async function () {
    await User.destroy({ where: {}, force: true });
  });

  describe('POST /api/feedback', function () {
    it('should return 201 on success', async function () {
      const res = await request(app)
        .post('/api/feedback')
        .send(validPayload);

      expect(res.status).to.equal(201);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal('Thank you for your feedback.');
    });

    it('should store user_id when valid JWT provided', async function () {
      const res = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validPayload);

      expect(res.status).to.equal(201);

      const row = await Feedback.findOne({
        where: { feedback: validPayload.feedback },
      });
      expect(row!.user_id).to.equal(testUser.id);
    });

    it('should store null user_id when no token', async function () {
      const res = await request(app)
        .post('/api/feedback')
        .send(validPayload);

      expect(res.status).to.equal(201);

      const row = await Feedback.findOne({
        where: { feedback: validPayload.feedback },
      });
      expect(row!.user_id).to.be.null;
    });

    it('should return 201 when rating, name, email all omitted (all optional)', async function () {
      const res = await request(app)
        .post('/api/feedback')
        .send({ feedback: 'Just feedback text without optional fields' });

      expect(res.status).to.equal(201);
      expect(res.body.success).to.be.true;
    });

    it('should return 400 when rating is 0 (below min)', async function () {
      const res = await request(app)
        .post('/api/feedback')
        .send({ ...validPayload, rating: 0 });

      expect(res.status).to.equal(400);
      expect(res.body.success).to.be.false;
    });

    it('should return 400 when rating is 6 (above max)', async function () {
      const res = await request(app)
        .post('/api/feedback')
        .send({ ...validPayload, rating: 6 });

      expect(res.status).to.equal(400);
      expect(res.body.success).to.be.false;
    });

    it('should return 400 when feedback is missing', async function () {
      const res = await request(app)
        .post('/api/feedback')
        .send({ rating: 5, name: 'Test' });

      expect(res.status).to.equal(400);
      expect(res.body.success).to.be.false;
    });

    it('should return 400 when feedback is under 5 chars', async function () {
      const res = await request(app)
        .post('/api/feedback')
        .send({ feedback: 'Hi' });

      expect(res.status).to.equal(400);
      expect(res.body.success).to.be.false;
    });

    it('should return 400 when email is present but invalid format', async function () {
      const res = await request(app)
        .post('/api/feedback')
        .send({ ...validPayload, email: 'not-an-email' });

      expect(res.status).to.equal(400);
      expect(res.body.success).to.be.false;
    });
  });
});
