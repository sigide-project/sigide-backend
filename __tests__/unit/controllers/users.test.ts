import { expect } from 'chai';
import sinon from 'sinon';
import { Request, Response } from 'express';
import usersController from '../../../src/controllers/users';
import usersService from '../../../src/services/users';
import { createMockUser } from '../../helpers';

describe('Users Controller', function () {
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

  describe('getMe', function () {
    it('should return current user profile', async function () {
      mockReq = {
        user: createMockUser(),
      };

      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
        avatar_url: null,
        role: 'user',
        rating: 4.5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      sandbox.stub(usersService, 'getById').resolves(mockUser as any);

      await usersController.getMe(mockReq as Request, mockRes as Response);

      expect(jsonSpy).to.have.been.calledWith(
        sinon.match({
          success: true,
          user: sinon.match({ id: 'user-123' }),
        })
      );
    });

    it('should return 404 if user not found', async function () {
      mockReq = {
        user: createMockUser({ id: 'non-existent' }),
      };

      sandbox.stub(usersService, 'getById').resolves(null);

      await usersController.getMe(mockReq as Request, mockRes as Response);

      expect(statusStub).to.have.been.calledWith(404);
      expect(jsonSpy).to.have.been.calledWith(
        sinon.match({
          success: false,
          message: 'User not found',
        })
      );
    });
  });

  describe('getPublicProfile', function () {
    it('should return public profile', async function () {
      mockReq = {
        params: { username: 'testuser' },
      };

      const mockProfile = {
        id: 'user-123',
        username: 'testuser',
        name: 'Test User',
        avatar_url: null,
        rating: 4.5,
        createdAt: new Date(),
        itemsCount: 5,
      };

      sandbox.stub(usersService, 'getPublicProfile').resolves(mockProfile);

      await usersController.getPublicProfile(mockReq as Request, mockRes as Response);

      expect(jsonSpy).to.have.been.calledWith(
        sinon.match({
          success: true,
          user: sinon.match({ username: 'testuser' }),
        })
      );
    });

    it('should return 404 if user not found', async function () {
      mockReq = {
        params: { username: 'nonexistent' },
      };

      sandbox.stub(usersService, 'getPublicProfile').resolves(null);

      await usersController.getPublicProfile(mockReq as Request, mockRes as Response);

      expect(statusStub).to.have.been.calledWith(404);
    });
  });

  describe('checkUsernameAvailability', function () {
    it('should return available true for available username', async function () {
      mockReq = {
        params: { username: 'newusername' },
        user: createMockUser(),
      };

      sandbox.stub(usersService, 'isUsernameAvailable').resolves(true);

      await usersController.checkUsernameAvailability(mockReq as Request, mockRes as Response);

      expect(jsonSpy).to.have.been.calledWith(
        sinon.match({
          success: true,
          available: true,
        })
      );
    });

    it('should return available false for taken username', async function () {
      mockReq = {
        params: { username: 'takenusername' },
        user: createMockUser(),
      };

      sandbox.stub(usersService, 'isUsernameAvailable').resolves(false);

      await usersController.checkUsernameAvailability(mockReq as Request, mockRes as Response);

      expect(jsonSpy).to.have.been.calledWith(
        sinon.match({
          success: true,
          available: false,
        })
      );
    });
  });

  describe('updateMe', function () {
    it('should update user profile', async function () {
      mockReq = {
        user: createMockUser(),
        body: { name: 'Updated Name' },
      };

      const mockUser = {
        id: 'user-123',
        name: 'Updated Name',
      };

      sandbox.stub(usersService, 'updateMe').resolves(mockUser as any);

      await usersController.updateMe(mockReq as Request, mockRes as Response);

      expect(jsonSpy).to.have.been.calledWith(
        sinon.match({ user: sinon.match({ name: 'Updated Name' }) })
      );
    });

    it('should return 400 if username is taken', async function () {
      mockReq = {
        user: createMockUser(),
        body: { username: 'takenusername' },
      };

      sandbox.stub(usersService, 'isUsernameAvailable').resolves(false);

      await usersController.updateMe(mockReq as Request, mockRes as Response);

      expect(statusStub).to.have.been.calledWith(400);
      expect(jsonSpy).to.have.been.calledWith(
        sinon.match({
          success: false,
          message: sinon.match(/already taken/),
        })
      );
    });

    it('should return 404 if user not found', async function () {
      mockReq = {
        user: createMockUser({ id: 'non-existent' }),
        body: { name: 'Updated Name' },
      };

      sandbox.stub(usersService, 'updateMe').resolves(null);

      await usersController.updateMe(mockReq as Request, mockRes as Response);

      expect(statusStub).to.have.been.calledWith(404);
    });
  });

  describe('changePassword', function () {
    it('should change password successfully', async function () {
      mockReq = {
        user: createMockUser(),
        body: {
          currentPassword: 'oldpassword',
          newPassword: 'newpassword',
        },
      };

      sandbox.stub(usersService, 'changePassword').resolves({
        success: true,
        message: 'Password changed successfully',
      });

      await usersController.changePassword(mockReq as Request, mockRes as Response);

      expect(jsonSpy).to.have.been.calledWith(
        sinon.match({
          success: true,
          message: sinon.match(/successfully/),
        })
      );
    });

    it('should return 400 for wrong current password', async function () {
      mockReq = {
        user: createMockUser(),
        body: {
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword',
        },
      };

      sandbox.stub(usersService, 'changePassword').resolves({
        success: false,
        message: 'Current password is incorrect',
      });

      await usersController.changePassword(mockReq as Request, mockRes as Response);

      expect(statusStub).to.have.been.calledWith(400);
    });
  });

  describe('hasPassword', function () {
    it('should return hasPassword true', async function () {
      mockReq = {
        user: createMockUser(),
      };

      sandbox.stub(usersService, 'hasPassword').resolves(true);

      await usersController.hasPassword(mockReq as Request, mockRes as Response);

      expect(jsonSpy).to.have.been.calledWith(
        sinon.match({
          success: true,
          hasPassword: true,
        })
      );
    });

    it('should return hasPassword false', async function () {
      mockReq = {
        user: createMockUser(),
      };

      sandbox.stub(usersService, 'hasPassword').resolves(false);

      await usersController.hasPassword(mockReq as Request, mockRes as Response);

      expect(jsonSpy).to.have.been.calledWith(
        sinon.match({
          success: true,
          hasPassword: false,
        })
      );
    });
  });

  describe('setPassword', function () {
    it('should set password successfully', async function () {
      mockReq = {
        user: createMockUser(),
        body: { newPassword: 'newpassword123' },
      };

      sandbox.stub(usersService, 'setPassword').resolves({
        success: true,
        message: 'Password set successfully',
      });

      await usersController.setPassword(mockReq as Request, mockRes as Response);

      expect(jsonSpy).to.have.been.calledWith(
        sinon.match({
          success: true,
          message: sinon.match(/successfully/),
        })
      );
    });

    it('should return 400 if password already set', async function () {
      mockReq = {
        user: createMockUser(),
        body: { newPassword: 'newpassword123' },
      };

      sandbox.stub(usersService, 'setPassword').resolves({
        success: false,
        message: 'Password already set',
      });

      await usersController.setPassword(mockReq as Request, mockRes as Response);

      expect(statusStub).to.have.been.calledWith(400);
    });
  });
});
