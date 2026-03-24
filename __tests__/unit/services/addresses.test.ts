import { expect } from 'chai';
import sinon from 'sinon';
import { Address } from '../../../src/models';
import addressesService from '../../../src/services/addresses';

describe('Addresses Service', function () {
  let sandbox: sinon.SinonSandbox;

  beforeEach(function () {
    sandbox = sinon.createSandbox();
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('getByUserId', function () {
    it('should return all addresses for user', async function () {
      const mockAddresses = [
        { id: 'addr-1', user_id: 'user-123', label: 'Home', is_default: true },
        { id: 'addr-2', user_id: 'user-123', label: 'Work', is_default: false },
      ];
      sandbox.stub(Address, 'findAll').resolves(mockAddresses as unknown as Address[]);

      const result = await addressesService.getByUserId('user-123');

      expect(result).to.have.length(2);
      expect(Address.findAll).to.have.been.calledWith({
        where: { user_id: 'user-123' },
        order: [['is_default', 'DESC'], ['createdAt', 'DESC']],
      });
    });

    it('should return empty array for user with no addresses', async function () {
      sandbox.stub(Address, 'findAll').resolves([]);

      const result = await addressesService.getByUserId('user-123');

      expect(result).to.have.length(0);
    });
  });

  describe('getById', function () {
    it('should return address by id for user', async function () {
      const mockAddress = {
        id: 'addr-123',
        user_id: 'user-123',
        label: 'Home',
        address_line1: '123 Main St',
        address_line2: null,
        city: 'Bangalore',
        state: 'Karnataka',
        postal_code: '560001',
        country: 'India',
        is_default: true,
        lat: 12.9716,
        lng: 77.5946,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      sandbox.stub(Address, 'findOne').resolves(mockAddress as unknown as Address);

      const result = await addressesService.getById('addr-123', 'user-123');

      expect(result).to.not.be.null;
      expect(result!.id).to.equal('addr-123');
      expect(Address.findOne).to.have.been.calledWith({
        where: { id: 'addr-123', user_id: 'user-123' },
      });
    });

    it('should return null for non-existent address', async function () {
      sandbox.stub(Address, 'findOne').resolves(null);

      const result = await addressesService.getById('non-existent', 'user-123');

      expect(result).to.be.null;
    });

    it('should return null for address belonging to different user', async function () {
      sandbox.stub(Address, 'findOne').resolves(null);

      const result = await addressesService.getById('addr-123', 'other-user');

      expect(result).to.be.null;
    });
  });

  describe('create', function () {
    it('should create address and set as default if first address', async function () {
      const mockAddress = {
        id: 'new-addr',
        user_id: 'user-123',
        label: 'Home',
        is_default: true,
        address_line1: '123 Main St',
        address_line2: null,
        city: 'Bangalore',
        state: 'Karnataka',
        postal_code: '560001',
        country: 'India',
        lat: null,
        lng: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      sandbox.stub(Address, 'count').resolves(0);
      sandbox.stub(Address, 'create').resolves(mockAddress as unknown as Address);

      const result = await addressesService.create('user-123', {
        label: 'Home',
        address_line1: '123 Main St',
        city: 'Bangalore',
        state: 'Karnataka',
        postal_code: '560001',
      });

      expect(result.is_default).to.be.true;
    });

    it('should unset other defaults when creating default address', async function () {
      const mockAddress = {
        id: 'new-addr',
        user_id: 'user-123',
        label: 'Work',
        is_default: true,
        address_line1: '456 Office Rd',
        address_line2: null,
        city: 'Bangalore',
        state: 'Karnataka',
        postal_code: '560002',
        country: 'India',
        lat: null,
        lng: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      sandbox.stub(Address, 'count').resolves(1);
      const updateStub = sandbox.stub(Address, 'update').resolves([1]);
      sandbox.stub(Address, 'create').resolves(mockAddress as unknown as Address);

      await addressesService.create('user-123', {
        label: 'Work',
        address_line1: '456 Office Rd',
        city: 'Bangalore',
        state: 'Karnataka',
        postal_code: '560002',
        is_default: true,
      });

      expect(updateStub).to.have.been.calledWith(
        { is_default: false },
        { where: { user_id: 'user-123' } }
      );
    });
  });

  describe('update', function () {
    it('should update address', async function () {
      const mockAddress = {
        id: 'addr-123',
        user_id: 'user-123',
        label: 'Home',
        address_line1: '123 Main St',
        address_line2: null,
        city: 'Bangalore',
        state: 'Karnataka',
        postal_code: '560001',
        country: 'India',
        is_default: false,
        lat: null,
        lng: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        update: sandbox.stub().resolves(),
      };
      sandbox.stub(Address, 'findOne').resolves(mockAddress as unknown as Address);

      const result = await addressesService.update('addr-123', 'user-123', {
        label: 'Updated Home',
      });

      expect(result).to.not.be.null;
      expect(mockAddress.update).to.have.been.calledWith({ label: 'Updated Home' });
    });

    it('should return null for non-existent address', async function () {
      sandbox.stub(Address, 'findOne').resolves(null);

      const result = await addressesService.update('non-existent', 'user-123', {
        label: 'Updated',
      });

      expect(result).to.be.null;
    });

    it('should unset other defaults when setting as default', async function () {
      const mockAddress = {
        id: 'addr-123',
        user_id: 'user-123',
        label: 'Home',
        address_line1: '123 Main St',
        address_line2: null,
        city: 'Bangalore',
        state: 'Karnataka',
        postal_code: '560001',
        country: 'India',
        is_default: false,
        lat: null,
        lng: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        update: sandbox.stub().resolves(),
      };
      sandbox.stub(Address, 'findOne').resolves(mockAddress as unknown as Address);
      const updateStub = sandbox.stub(Address, 'update').resolves([1]);

      await addressesService.update('addr-123', 'user-123', { is_default: true });

      expect(updateStub).to.have.been.calledWith(
        { is_default: false },
        { where: { user_id: 'user-123' } }
      );
    });
  });

  describe('delete', function () {
    it('should delete address', async function () {
      const mockAddress = {
        id: 'addr-123',
        user_id: 'user-123',
        is_default: false,
        destroy: sandbox.stub().resolves(),
      };
      sandbox.stub(Address, 'findOne').resolves(mockAddress as unknown as Address);

      const result = await addressesService.delete('addr-123', 'user-123');

      expect(result).to.be.true;
      expect(mockAddress.destroy).to.have.been.called;
    });

    it('should set next address as default when deleting default', async function () {
      const mockAddress = {
        id: 'addr-123',
        user_id: 'user-123',
        is_default: true,
        destroy: sandbox.stub().resolves(),
      };
      const nextAddress = {
        id: 'addr-456',
        update: sandbox.stub().resolves(),
      };
      sandbox.stub(Address, 'findOne')
        .onFirstCall().resolves(mockAddress as unknown as Address)
        .onSecondCall().resolves(nextAddress as unknown as Address);

      await addressesService.delete('addr-123', 'user-123');

      expect(nextAddress.update).to.have.been.calledWith({ is_default: true });
    });

    it('should return false for non-existent address', async function () {
      sandbox.stub(Address, 'findOne').resolves(null);

      const result = await addressesService.delete('non-existent', 'user-123');

      expect(result).to.be.false;
    });
  });

  describe('setDefault', function () {
    it('should set address as default', async function () {
      const mockAddress = {
        id: 'addr-123',
        user_id: 'user-123',
        label: 'Home',
        address_line1: '123 Main St',
        address_line2: null,
        city: 'Bangalore',
        state: 'Karnataka',
        postal_code: '560001',
        country: 'India',
        is_default: false,
        lat: null,
        lng: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        update: sandbox.stub().resolves(),
      };
      sandbox.stub(Address, 'findOne').resolves(mockAddress as unknown as Address);
      sandbox.stub(Address, 'update').resolves([1]);

      const result = await addressesService.setDefault('addr-123', 'user-123');

      expect(result).to.not.be.null;
      expect(Address.update).to.have.been.calledWith(
        { is_default: false },
        { where: { user_id: 'user-123' } }
      );
      expect(mockAddress.update).to.have.been.calledWith({ is_default: true });
    });

    it('should return null for non-existent address', async function () {
      sandbox.stub(Address, 'findOne').resolves(null);

      const result = await addressesService.setDefault('non-existent', 'user-123');

      expect(result).to.be.null;
    });
  });
});
