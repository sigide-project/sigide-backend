import { expect } from 'chai';
import request from 'supertest';
import app from '../../src/index';
import { User, sequelize } from '../../src/models';

describe('Auth API', function () {
  this.timeout(10000);

  beforeEach(async function () {
    await User.destroy({ where: {}, force: true });
  });

  describe('POST /api/auth/register', function () {
    it('should register a new user successfully', async function () {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          phone: '1234567890',
        });

      expect(res.status).to.equal(201);
      expect(res.body.success).to.be.true;
      expect(res.body.user).to.have.property('id');
      expect(res.body.user.name).to.equal('Test User');
      expect(res.body.user.email).to.equal('test@example.com');
      expect(res.body.user.role).to.equal('user');
      expect(res.body.token).to.be.a('string');
      expect(res.body.user).to.not.have.property('password_hash');
    });

    it('should return 409 for duplicate email', async function () {
      await User.create({
        name: 'Existing User',
        email: 'test@example.com',
        password_hash: 'somehash',
        rating: 0,
        role: 'user',
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        });

      expect(res.status).to.equal(409);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.include('already exists');
    });

    it('should return 400 for weak password (less than 8 chars)', async function () {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'short',
        });

      expect(res.status).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('Validation failed');
      expect(res.body.errors).to.be.an('array');
      const passwordError = res.body.errors.find(
        (e: { field: string }) => e.field === 'password'
      );
      expect(passwordError).to.exist;
      expect(passwordError.message).to.include('8 characters');
    });

    it('should return 400 for invalid email format', async function () {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'not-an-email',
          password: 'password123',
        });

      expect(res.status).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.errors).to.be.an('array');
      const emailError = res.body.errors.find(
        (e: { field: string }) => e.field === 'email'
      );
      expect(emailError).to.exist;
    });

    it('should return 400 for missing required fields', async function () {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
        });

      expect(res.status).to.equal(400);
      expect(res.body.success).to.be.false;
    });
  });

  describe('POST /api/auth/login', function () {
    beforeEach(async function () {
      const bcrypt = await import('bcrypt');
      const hashedPassword = await bcrypt.hash('password123', 10);

      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password_hash: hashedPassword,
        rating: 0,
        role: 'user',
      });
    });

    it('should login successfully with valid credentials', async function () {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.user).to.have.property('id');
      expect(res.body.user.email).to.equal('test@example.com');
      expect(res.body.token).to.be.a('string');
      expect(res.body.user).to.not.have.property('password_hash');
    });

    it('should return 401 for wrong password', async function () {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        });

      expect(res.status).to.equal(401);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('Invalid email or password');
    });

    it('should return 401 for unknown email', async function () {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'unknown@example.com',
          password: 'password123',
        });

      expect(res.status).to.equal(401);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('Invalid email or password');
    });

    it('should return same error message for wrong email and wrong password', async function () {
      const wrongEmailRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'unknown@example.com',
          password: 'password123',
        });

      const wrongPasswordRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        });

      expect(wrongEmailRes.body.message).to.equal(wrongPasswordRes.body.message);
    });

    it('should handle case-insensitive email login', async function () {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'TEST@EXAMPLE.COM',
          password: 'password123',
        });

      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
    });
  });

  describe('GET /api/auth/google', function () {
    it('should redirect to Google OAuth', async function () {
      const res = await request(app)
        .get('/api/auth/google')
        .redirects(0);

      if (process.env.GOOGLE_CLIENT_ID) {
        expect(res.status).to.equal(302);
        expect(res.headers.location).to.include('accounts.google.com');
      } else {
        expect([302, 500]).to.include(res.status);
      }
    });
  });
});
