import { expect } from 'chai';
import sinon from 'sinon';
import bcrypt from 'bcrypt';
import { User, Item } from '../../../src/models';
import usersService from '../../../src/services/users';

describe('Users Service', function () {
  let sandbox: sinon.SinonSandbox;

  beforeEach(function () {
    sandbox = sinon.createSandbox();
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('getById', function () {
    it('should return user by id', async function () {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
        avatar_url: 'https://example.com/avatar.jpg',
        rating: 4.5,
        role: 'user' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      sandbox.stub(User, 'findByPk').resolves(mockUser as unknown as User);

      const result = await usersService.getById('user-123');

      expect(result).to.not.be.null;
      expect(result!.id).to.equal('user-123');
      expect(result!.name).to.equal('Test User');
    });

    it('should return null for non-existent user', async function () {
      sandbox.stub(User, 'findByPk').resolves(null);

      const result = await usersService.getById('non-existent');

      expect(result).to.be.null;
    });
  });

  describe('getByUsername', function () {
    it('should return user by username', async function () {
      const mockUser = { id: 'user-123', username: 'testuser' };
      sandbox.stub(User, 'findOne').resolves(mockUser as User);

      const result = await usersService.getByUsername('testuser');

      expect(result).to.deep.equal(mockUser);
      expect(User.findOne).to.have.been.calledWith({ where: { username: 'testuser' } });
    });
  });

  describe('getPublicProfile', function () {
    it('should return public profile for active user', async function () {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
        rating: 4.5,
        isActive: true,
        createdAt: new Date(),
      };
      sandbox.stub(User, 'findOne').resolves(mockUser as unknown as User);
      sandbox.stub(Item, 'count').resolves(5);

      const result = await usersService.getPublicProfile('testuser');

      expect(result).to.not.be.null;
      expect(result!.username).to.equal('testuser');
      expect(result!.itemsCount).to.equal(5);
    });

    it('should return null for inactive user', async function () {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        isActive: false,
      };
      sandbox.stub(User, 'findOne').resolves(mockUser as unknown as User);

      const result = await usersService.getPublicProfile('testuser');

      expect(result).to.be.null;
    });

    it('should return null for non-existent user', async function () {
      sandbox.stub(User, 'findOne').resolves(null);

      const result = await usersService.getPublicProfile('nonexistent');

      expect(result).to.be.null;
    });
  });

  describe('isUsernameAvailable', function () {
    it('should return true if username is available', async function () {
      sandbox.stub(User, 'findOne').resolves(null);

      const result = await usersService.isUsernameAvailable('newusername');

      expect(result).to.be.true;
    });

    it('should return false if username is taken', async function () {
      const mockUser = { id: 'other-user', username: 'takenusername' };
      sandbox.stub(User, 'findOne').resolves(mockUser as User);

      const result = await usersService.isUsernameAvailable('takenusername');

      expect(result).to.be.false;
    });

    it('should return true if username belongs to excluded user', async function () {
      const mockUser = { id: 'user-123', username: 'myusername' };
      sandbox.stub(User, 'findOne').resolves(mockUser as User);

      const result = await usersService.isUsernameAvailable('myusername', 'user-123');

      expect(result).to.be.true;
    });
  });

  describe('updateMe', function () {
    it('should update user profile', async function () {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        name: 'Old Name',
        email: 'test@example.com',
        phone: null,
        avatar_url: null,
        rating: 0,
        role: 'user' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        update: sandbox.stub().resolves(),
      };
      sandbox.stub(User, 'findByPk').resolves(mockUser as unknown as User);

      const result = await usersService.updateMe('user-123', {
        name: 'New Name',
        phone: '9876543210',
      });

      expect(mockUser.update).to.have.been.calledWith({
        name: 'New Name',
        phone: '9876543210',
      });
      expect(result).to.not.be.null;
    });

    it('should return null for non-existent user', async function () {
      sandbox.stub(User, 'findByPk').resolves(null);

      const result = await usersService.updateMe('non-existent', { name: 'New Name' });

      expect(result).to.be.null;
    });

    it('should not update if no data provided', async function () {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        phone: null,
        avatar_url: null,
        rating: 0,
        role: 'user' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        update: sandbox.stub().resolves(),
      };
      sandbox.stub(User, 'findByPk').resolves(mockUser as unknown as User);

      await usersService.updateMe('user-123', {});

      expect(mockUser.update).to.not.have.been.called;
    });
  });

  describe('hasPassword', function () {
    it('should return true if user has password', async function () {
      const mockUser = {
        id: 'user-123',
        password_hash: 'somehash',
      };
      sandbox.stub(User, 'findByPk').resolves(mockUser as unknown as User);

      const result = await usersService.hasPassword('user-123');

      expect(result).to.be.true;
    });

    it('should return false if user has no password', async function () {
      const mockUser = {
        id: 'user-123',
        password_hash: '',
      };
      sandbox.stub(User, 'findByPk').resolves(mockUser as unknown as User);

      const result = await usersService.hasPassword('user-123');

      expect(result).to.be.false;
    });

    it('should return false for non-existent user', async function () {
      sandbox.stub(User, 'findByPk').resolves(null);

      const result = await usersService.hasPassword('non-existent');

      expect(result).to.be.false;
    });
  });

  describe('setPassword', function () {
    it('should set password for user without password', async function () {
      const updateStub = sandbox.stub().resolves();
      const mockUser = {
        id: 'user-123',
        password_hash: '',
        update: updateStub,
      };
      sandbox.stub(User, 'findByPk').resolves(mockUser as unknown as User);

      const result = await usersService.setPassword('user-123', 'newpassword');

      expect(result.success).to.be.true;
      expect(result.message).to.include('successfully');
      expect(updateStub).to.have.been.called;
      const updateArg = updateStub.firstCall.args[0];
      expect(updateArg.password_hash).to.be.a('string');
      expect(updateArg.password_hash.length).to.be.greaterThan(0);
    });

    it('should fail if user already has password', async function () {
      const mockUser = {
        id: 'user-123',
        password_hash: 'existinghash',
      };
      sandbox.stub(User, 'findByPk').resolves(mockUser as unknown as User);

      const result = await usersService.setPassword('user-123', 'newpassword');

      expect(result.success).to.be.false;
      expect(result.message).to.include('already set');
    });

    it('should fail for non-existent user', async function () {
      sandbox.stub(User, 'findByPk').resolves(null);

      const result = await usersService.setPassword('non-existent', 'newpassword');

      expect(result.success).to.be.false;
      expect(result.message).to.include('not found');
    });
  });

  describe('changePassword', function () {
    it('should change password with valid current password', async function () {
      const currentHash = await bcrypt.hash('oldpassword', 10);
      const updateStub = sandbox.stub().resolves();
      const mockUser = {
        id: 'user-123',
        password_hash: currentHash,
        update: updateStub,
      };
      sandbox.stub(User, 'findByPk').resolves(mockUser as unknown as User);

      const result = await usersService.changePassword('user-123', {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword',
      });

      expect(result.success).to.be.true;
      expect(result.message).to.include('successfully');
    });

    it('should fail with wrong current password', async function () {
      const currentHash = await bcrypt.hash('correctpassword', 10);
      const mockUser = {
        id: 'user-123',
        password_hash: currentHash,
      };
      sandbox.stub(User, 'findByPk').resolves(mockUser as unknown as User);

      const result = await usersService.changePassword('user-123', {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword',
      });

      expect(result.success).to.be.false;
      expect(result.message).to.include('incorrect');
    });

    it('should fail for user without password', async function () {
      const mockUser = {
        id: 'user-123',
        password_hash: '',
      };
      sandbox.stub(User, 'findByPk').resolves(mockUser as unknown as User);

      const result = await usersService.changePassword('user-123', {
        currentPassword: 'anypassword',
        newPassword: 'newpassword',
      });

      expect(result.success).to.be.false;
      expect(result.message).to.include('No password set');
    });
  });

  describe('toSafeUser', function () {
    it('should convert user to safe response format', function () {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
        avatar_url: 'https://example.com/avatar.jpg',
        rating: 4.5,
        role: 'user' as const,
        password_hash: 'should-not-be-included',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      } as unknown as User;

      const result = usersService.toSafeUser(mockUser);

      expect(result).to.have.property('id', 'user-123');
      expect(result).to.have.property('username', 'testuser');
      expect(result).to.have.property('name', 'Test User');
      expect(result).to.have.property('email', 'test@example.com');
      expect(result).to.not.have.property('password_hash');
    });
  });
});
