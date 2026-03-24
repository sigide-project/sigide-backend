import { expect } from 'chai';
import sinon from 'sinon';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../../../src/models';
import {
  signToken,
  verifyToken,
  hashPassword,
  comparePassword,
  formatUserResponse,
  findUserByEmail,
  createUser,
  findOrCreateGoogleUser,
  authenticateUser,
} from '../../../src/services/auth';

describe('Auth Service', function () {
  let sandbox: sinon.SinonSandbox;

  beforeEach(function () {
    sandbox = sinon.createSandbox();
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('signToken', function () {
    it('should generate a valid JWT token', function () {
      const user = { id: 'user-123', email: 'test@example.com', role: 'user' as const };
      const token = signToken(user);

      expect(token).to.be.a('string');
      expect(token.split('.')).to.have.length(3);
    });

    it('should include user id and email in token payload', function () {
      const user = { id: 'user-123', email: 'test@example.com', role: 'user' as const };
      const token = signToken(user);
      const decoded = jwt.decode(token) as { id: string; email: string };

      expect(decoded.id).to.equal('user-123');
      expect(decoded.email).to.equal('test@example.com');
    });
  });

  describe('verifyToken', function () {
    it('should verify a valid token', function () {
      const user = { id: 'user-123', email: 'test@example.com', role: 'user' as const };
      const token = signToken(user);
      const decoded = verifyToken(token);

      expect(decoded.id).to.equal('user-123');
      expect(decoded.email).to.equal('test@example.com');
    });

    it('should throw for invalid token', function () {
      expect(() => verifyToken('invalid-token')).to.throw();
    });
  });

  describe('hashPassword', function () {
    it('should hash a password', async function () {
      const password = 'testpassword123';
      const hash = await hashPassword(password);

      expect(hash).to.be.a('string');
      expect(hash).to.not.equal(password);
      expect(hash.length).to.be.greaterThan(20);
    });

    it('should generate different hashes for same password', async function () {
      const password = 'testpassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).to.not.equal(hash2);
    });
  });

  describe('comparePassword', function () {
    it('should return true for matching password', async function () {
      const password = 'testpassword123';
      const hash = await bcrypt.hash(password, 10);
      const result = await comparePassword(password, hash);

      expect(result).to.be.true;
    });

    it('should return false for non-matching password', async function () {
      const hash = await bcrypt.hash('correctpassword', 10);
      const result = await comparePassword('wrongpassword', hash);

      expect(result).to.be.false;
    });
  });

  describe('formatUserResponse', function () {
    it('should format user data correctly', function () {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        avatar_url: 'https://example.com/avatar.jpg',
        role: 'user' as const,
        password_hash: 'should-not-be-included',
      } as unknown as User;

      const result = formatUserResponse(mockUser);

      expect(result).to.deep.equal({
        id: 'user-123',
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        avatar_url: 'https://example.com/avatar.jpg',
        role: 'user',
      });
    });

    it('should handle null avatar_url', function () {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        avatar_url: null,
        role: 'user' as const,
      } as unknown as User;

      const result = formatUserResponse(mockUser);

      expect(result.avatar_url).to.be.null;
    });
  });

  describe('findUserByEmail', function () {
    it('should find user by email', async function () {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      sandbox.stub(User, 'findOne').resolves(mockUser as User);

      const result = await findUserByEmail('test@example.com');

      expect(result).to.deep.equal(mockUser);
      expect(User.findOne).to.have.been.calledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should convert email to lowercase', async function () {
      sandbox.stub(User, 'findOne').resolves(null);

      await findUserByEmail('TEST@EXAMPLE.COM');

      expect(User.findOne).to.have.been.calledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return null when user not found', async function () {
      sandbox.stub(User, 'findOne').resolves(null);

      const result = await findUserByEmail('notfound@example.com');

      expect(result).to.be.null;
    });
  });

  describe('createUser', function () {
    it('should create a new user with password', async function () {
      const mockUser = {
        id: 'new-user-id',
        name: 'New User',
        email: 'new@example.com',
      };
      sandbox.stub(User, 'create').resolves(mockUser as User);

      const result = await createUser({
        name: 'New User',
        email: 'new@example.com',
        password: 'password123',
      });

      expect(result).to.deep.equal(mockUser);
      const createCall = (User.create as sinon.SinonStub).firstCall;
      expect(createCall.args[0].email).to.equal('new@example.com');
      expect(createCall.args[0].password_hash).to.be.a('string');
      expect(createCall.args[0].password_hash.length).to.be.greaterThan(0);
    });

    it('should create a user without password (OAuth)', async function () {
      const mockUser = {
        id: 'new-user-id',
        name: 'OAuth User',
        email: 'oauth@example.com',
      };
      sandbox.stub(User, 'create').resolves(mockUser as User);

      await createUser({
        name: 'OAuth User',
        email: 'oauth@example.com',
      });

      const createCall = (User.create as sinon.SinonStub).firstCall;
      expect(createCall.args[0].password_hash).to.equal('');
    });
  });

  describe('findOrCreateGoogleUser', function () {
    it('should return existing user if found', async function () {
      const existingUser = {
        id: 'existing-user',
        email: 'google@example.com',
        avatar_url: 'existing-avatar',
        update: sandbox.stub().resolves(),
      };
      sandbox.stub(User, 'findOne').resolves(existingUser as unknown as User);
      const createStub = sandbox.stub(User, 'create');

      const profile = {
        id: 'google-123',
        displayName: 'Google User',
        emails: [{ value: 'google@example.com' }],
        photos: [{ value: 'new-avatar-url' }],
      };

      const result = await findOrCreateGoogleUser(profile);

      expect(result).to.deep.equal(existingUser);
      expect(createStub).to.not.have.been.called;
    });

    it('should create new user if not found', async function () {
      const newUser = {
        id: 'new-user',
        email: 'google@example.com',
      };
      sandbox.stub(User, 'findOne').resolves(null);
      sandbox.stub(User, 'create').resolves(newUser as User);

      const profile = {
        id: 'google-123',
        displayName: 'Google User',
        emails: [{ value: 'google@example.com' }],
        photos: [{ value: 'avatar-url' }],
      };

      const result = await findOrCreateGoogleUser(profile);

      expect(result).to.deep.equal(newUser);
      expect(User.create).to.have.been.called;
    });

    it('should throw error if no email in profile', async function () {
      const profile = {
        id: 'google-123',
        displayName: 'Google User',
        emails: [],
      };

      try {
        await findOrCreateGoogleUser(profile);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect((error as Error).message).to.include('email');
      }
    });
  });

  describe('authenticateUser', function () {
    it('should return user for valid credentials', async function () {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password_hash: hashedPassword,
      };
      sandbox.stub(User, 'findOne').resolves(mockUser as User);

      const result = await authenticateUser('test@example.com', 'password123');

      expect(result).to.deep.equal(mockUser);
    });

    it('should return null for wrong password', async function () {
      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password_hash: hashedPassword,
      };
      sandbox.stub(User, 'findOne').resolves(mockUser as User);

      const result = await authenticateUser('test@example.com', 'wrongpassword');

      expect(result).to.be.null;
    });

    it('should return null for non-existent user', async function () {
      sandbox.stub(User, 'findOne').resolves(null);

      const result = await authenticateUser('notfound@example.com', 'password123');

      expect(result).to.be.null;
    });

    it('should return null for user without password (OAuth only)', async function () {
      const mockUser = {
        id: 'user-123',
        email: 'oauth@example.com',
        password_hash: '',
      };
      sandbox.stub(User, 'findOne').resolves(mockUser as User);

      const result = await authenticateUser('oauth@example.com', 'anypassword');

      expect(result).to.be.null;
    });
  });
});
