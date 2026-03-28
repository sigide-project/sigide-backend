import { expect } from 'chai';
import request from 'supertest';
import app from '../../src/index';
import { User, Report } from '../../src/models';
import { generateToken } from '../../src/middlewares/auth';

describe('Reports API', function () {
  this.timeout(10000);

  let testUser: User;
  let authToken: string;

  const validPayload = {
    issue_type: 'Bug or Technical Issue',
    email: 'reporter@example.com',
    description: 'This is a detailed description of the issue encountered.',
  };

  before(async function () {
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash('password123', 10);

    testUser = await User.create({
      name: 'Auth User',
      email: 'auth-report@example.com',
      password_hash: hashedPassword,
      rating: 0,
      role: 'user',
    });

    authToken = generateToken({ id: testUser.id, email: testUser.email });
  });

  afterEach(async function () {
    await Report.destroy({ where: {}, force: true });
  });

  after(async function () {
    await User.destroy({ where: {}, force: true });
  });

  describe('POST /api/reports', function () {
    it('should return 201 and set status to open on success', async function () {
      const res = await request(app)
        .post('/api/reports')
        .send(validPayload);

      expect(res.status).to.equal(201);
      expect(res.body.success).to.be.true;
      expect(res.body.message).to.equal('Your report has been submitted.');

      const row = await Report.findOne({
        where: { email: validPayload.email },
      });
      expect(row).to.not.be.null;
      expect(row!.status).to.equal('open');
    });

    it('should store user_id when valid JWT provided', async function () {
      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validPayload);

      expect(res.status).to.equal(201);

      const row = await Report.findOne({
        where: { email: validPayload.email },
      });
      expect(row!.user_id).to.equal(testUser.id);
    });

    it('should store null user_id when no token provided', async function () {
      const res = await request(app)
        .post('/api/reports')
        .send(validPayload);

      expect(res.status).to.equal(201);

      const row = await Report.findOne({
        where: { email: validPayload.email },
      });
      expect(row!.user_id).to.be.null;
    });

    it('should return 400 when issue_type is not one of the valid values', async function () {
      const res = await request(app)
        .post('/api/reports')
        .send({ ...validPayload, issue_type: 'Invalid Type' });

      expect(res.status).to.equal(400);
      expect(res.body.success).to.be.false;
    });

    it('should return 400 when email is invalid format', async function () {
      const res = await request(app)
        .post('/api/reports')
        .send({ ...validPayload, email: 'bad-email' });

      expect(res.status).to.equal(400);
      expect(res.body.success).to.be.false;
    });

    it('should return 400 when description is under 10 chars', async function () {
      const res = await request(app)
        .post('/api/reports')
        .send({ ...validPayload, description: 'short' });

      expect(res.status).to.equal(400);
      expect(res.body.success).to.be.false;
    });

    it('should return 400 when listing_url is present but not a valid URL', async function () {
      const res = await request(app)
        .post('/api/reports')
        .send({ ...validPayload, listing_url: 'not-a-url' });

      expect(res.status).to.equal(400);
      expect(res.body.success).to.be.false;
    });

    it('should return 201 when listing_url is omitted (optional field)', async function () {
      const res = await request(app)
        .post('/api/reports')
        .send(validPayload);

      expect(res.status).to.equal(201);
      expect(res.body.success).to.be.true;
    });
  });
});
