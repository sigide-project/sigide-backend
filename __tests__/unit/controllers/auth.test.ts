import { expect } from 'chai';
import sinon from 'sinon';
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { User } from '../../../src/models';
import * as authController from '../../../src/controllers/auth';
import { createMockUser } from '../../helpers';

describe('Auth Controller', function () {
  let sandbox: sinon.SinonSandbox;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonSpy: sinon.SinonSpy;
  let statusStub: sinon.SinonStub;

  beforeEach(function () {
    sandbox = sinon.createSandbox();
    jsonSpy = sandbox.spy();
    statusStub = sandbox.stub().returns({ json: jsonSpy });
    mockRes = {
      json: jsonSpy,
      status: statusStub,
    };
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('register', function () {
    it('should register a new user successfully', async function () {
      mockReq = {
        body: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          phone: '1234567890',
        },
      };

      const mockUser = {
        id: 'user-123',
        username: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user' as const,
        avatar_url: null,
      };

      sandbox.stub(User, 'findOne').resolves(null);
      sandbox.stub(User, 'create').resolves(mockUser as unknown as User);

      await authController.register(mockReq as Request, mockRes as Response);

      expect(statusStub).to.have.been.calledWith(201);
      expect(jsonSpy).to.have.been.calledWith(
        sinon.match({
          success: true,
        })
      );
    });

    it('should return 400 for invalid email', async function () {
      mockReq = {
        body: {
          name: 'Test User',
          email: 'invalid-email',
          password: 'password123',
        },
      };

      await authController.register(mockReq as Request, mockRes as Response);

      expect(statusStub).to.have.been.calledWith(400);
      expect(jsonSpy).to.have.been.calledWith(
        sinon.match({
          success: false,
          message: 'Validation failed',
        })
      );
    });

    it('should return 400 for short password', async function () {
      mockReq = {
        body: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'short',
        },
      };

      await authController.register(mockReq as Request, mockRes as Response);

      expect(statusStub).to.have.been.calledWith(400);
      expect(jsonSpy).to.have.been.calledWith(
        sinon.match({
          success: false,
          message: 'Validation failed',
        })
      );
    });

    it('should return 409 for existing email', async function () {
      mockReq = {
        body: {
          name: 'Test User',
          email: 'existing@example.com',
          password: 'password123',
        },
      };

      sandbox.stub(User, 'findOne').resolves({ id: 'existing-user' } as User);

      await authController.register(mockReq as Request, mockRes as Response);

      expect(statusStub).to.have.been.calledWith(409);
      expect(jsonSpy).to.have.been.calledWith(
        sinon.match({
          success: false,
          message: sinon.match(/already exists/),
        })
      );
    });
  });

  describe('login', function () {
    it('should login successfully with valid credentials', async function () {
      mockReq = {
        body: {
          email: 'test@example.com',
          password: 'password123',
        },
      };

      const hashedPassword = await bcrypt.hash('password123', 10);
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        password_hash: hashedPassword,
        role: 'user' as const,
        avatar_url: null,
        isActive: true,
      };

      sandbox.stub(User, 'findOne').resolves(mockUser as unknown as User);

      await authController.login(mockReq as Request, mockRes as Response);

      expect(statusStub).to.have.been.calledWith(200);
      expect(jsonSpy).to.have.been.calledWith(
        sinon.match({
          success: true,
        })
      );
    });

    it('should return 401 for invalid credentials', async function () {
      mockReq = {
        body: {
          email: 'test@example.com',
          password: 'wrongpassword',
        },
      };

      sandbox.stub(User, 'findOne').resolves(null);

      await authController.login(mockReq as Request, mockRes as Response);

      expect(statusStub).to.have.been.calledWith(401);
      expect(jsonSpy).to.have.been.calledWith(
        sinon.match({
          success: false,
          message: 'Invalid email or password',
        })
      );
    });

    it('should return 401 for deactivated account', async function () {
      mockReq = {
        body: {
          email: 'test@example.com',
          password: 'password123',
        },
      };

      const hashedPassword = await bcrypt.hash('password123', 10);
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password_hash: hashedPassword,
        isActive: false,
      };

      sandbox.stub(User, 'findOne').resolves(mockUser as unknown as User);

      await authController.login(mockReq as Request, mockRes as Response);

      expect(statusStub).to.have.been.calledWith(401);
      expect(jsonSpy).to.have.been.calledWith(
        sinon.match({
          success: false,
          message: sinon.match(/deactivated/),
        })
      );
    });

    it('should return 400 for invalid email format', async function () {
      mockReq = {
        body: {
          email: 'invalid-email',
          password: 'password123',
        },
      };

      await authController.login(mockReq as Request, mockRes as Response);

      expect(statusStub).to.have.been.calledWith(400);
    });
  });

  describe('googleCallback', function () {
    it('should redirect with token on successful auth', function () {
      const redirectSpy = sandbox.spy();
      mockReq = {
        user: createMockUser(),
      };
      mockRes = {
        redirect: redirectSpy,
      };

      authController.googleCallback(mockReq as Request, mockRes as Response);

      expect(redirectSpy).to.have.been.calledWith(
        sinon.match(/token=/)
      );
    });

    it('should redirect to login with error when no user', function () {
      const redirectSpy = sandbox.spy();
      mockReq = {
        user: undefined,
      };
      mockRes = {
        redirect: redirectSpy,
      };

      authController.googleCallback(mockReq as Request, mockRes as Response);

      expect(redirectSpy).to.have.been.calledWith(
        sinon.match(/error=google_failed/)
      );
    });
  });
});
