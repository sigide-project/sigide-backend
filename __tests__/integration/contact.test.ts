import { expect } from 'chai';
import request from 'supertest';
import app from '../../src/index';
import { User, ContactMessage } from '../../src/models';
import { generateToken } from '../../src/middlewares/auth';

describe('Contact API', function () {
  this.timeout(10000);

  let testUser: User;
  let authToken: string;

  const validPayload = {
    name: 'Test User',
    email: 'test@example.com',
    subject: 'Test Subject',
    message: 'This is a test message with enough characters.',
  };

  before(async function () {
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash('password123', 10);

    testUser = await User.create({
      name: 'Auth User',
      email: 'auth@example.com',
      password_hash: hashedPassword,
      rating: 0,
      role: 'user',
    });

    authToken = generateToken({ id: testUser.id, email: testUser.email });
  });

  afterEach(async function () {
    await ContactMessage.destroy({ where: {}, force: true });
  });

  after(async function () {
    await User.destroy({ where: {}, force: true });
  });

  describe('POST /api/contact', function () {
    it('should return 201 and insert row on success', async function () {
      const res = await request(app)
        .post('/api/contact')
        .send(validPayload);

      expect(res.status).to.equal(201);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal('Your message has been sent.');

      const row = await ContactMessage.findOne({
        where: { email: validPayload.email },
      });
      expect(row).to.not.be.null;
      expect(row!.name).to.equal(validPayload.name);
      expect(row!.subject).to.equal(validPayload.subject);
    });

    it('should store user_id when valid JWT provided', async function () {
      const res = await request(app)
        .post('/api/contact')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validPayload);

      expect(res.status).to.equal(201);

      const row = await ContactMessage.findOne({
        where: { email: validPayload.email },
      });
      expect(row!.user_id).to.equal(testUser.id);
    });

    it('should store null user_id when no token provided', async function () {
      const res = await request(app)
        .post('/api/contact')
        .send(validPayload);

      expect(res.status).to.equal(201);

      const row = await ContactMessage.findOne({
        where: { email: validPayload.email },
      });
      expect(row!.user_id).to.be.null;
    });

    it('should return 400 when name is missing', async function () {
      const res = await request(app)
        .post('/api/contact')
        .send({ ...validPayload, name: '' });

      expect(res.status).to.equal(400);
      expect(res.body.success).to.be.false;
    });

    it('should return 400 when email is invalid format', async function () {
      const res = await request(app)
        .post('/api/contact')
        .send({ ...validPayload, email: 'not-an-email' });

      expect(res.status).to.equal(400);
      expect(res.body.success).to.be.false;
    });

    it('should return 400 when message is under 10 chars', async function () {
      const res = await request(app)
        .post('/api/contact')
        .send({ ...validPayload, message: 'short' });

      expect(res.status).to.equal(400);
      expect(res.body.success).to.be.false;
    });

    it('should return 400 when subject is missing', async function () {
      const res = await request(app)
        .post('/api/contact')
        .send({ ...validPayload, subject: '' });

      expect(res.status).to.equal(400);
      expect(res.body.success).to.be.false;
    });
  });
});
