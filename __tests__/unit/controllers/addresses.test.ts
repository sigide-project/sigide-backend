import { expect } from 'chai';
import sinon from 'sinon';
import { Request, Response } from 'express';
import addressesController from '../../../src/controllers/addresses';
import addressesService from '../../../src/services/addresses';
import { createMockUser } from '../../helpers';

describe('Addresses Controller', function () {
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

  describe('getAll', function () {
    it('should return all addresses for user', async function () {
      mockReq = {
        user: createMockUser(),
      };

      const mockAddresses = [
        { id: 'addr-1', label: 'Home' },
        { id: 'addr-2', label: 'Work' },
      ];
      sandbox.stub(addressesService, 'getByUserId').resolves(mockAddresses as any);

      await addressesController.getAll(mockReq as Request, mockRes as Response);

      expect(jsonSpy).to.have.been.calledWith(
        sinon.match({
          success: true,
          data: sinon.match.array,
        })
      );
    });
  });

  describe('getOne', function () {
    it('should return address by id', async function () {
      mockReq = {
        user: createMockUser(),
        params: { id: 'addr-123' },
      };

      const mockAddress = { id: 'addr-123', label: 'Home' };
      sandbox.stub(addressesService, 'getById').resolves(mockAddress as any);

      await addressesController.getOne(mockReq as Request, mockRes as Response);

      expect(jsonSpy).to.have.been.calledWith(
        sinon.match({
          success: true,
          data: sinon.match({ id: 'addr-123' }),
        })
      );
    });

    it('should return 404 for non-existent address', async function () {
      mockReq = {
        user: createMockUser(),
        params: { id: 'non-existent' },
      };

      sandbox.stub(addressesService, 'getById').resolves(null);

      await addressesController.getOne(mockReq as Request, mockRes as Response);

      expect(statusStub).to.have.been.calledWith(404);
      expect(jsonSpy).to.have.been.calledWith(
        sinon.match({
          success: false,
          message: 'Address not found',
        })
      );
    });
  });

  describe('create', function () {
    it('should create a new address', async function () {
      mockReq = {
        user: createMockUser(),
        body: {
          label: 'Home',
          address_line1: '123 Main St',
          city: 'Bangalore',
          state: 'Karnataka',
          postal_code: '560001',
        },
      };

      const mockAddress = {
        id: 'new-addr',
        label: 'Home',
        address_line1: '123 Main St',
      };
      sandbox.stub(addressesService, 'create').resolves(mockAddress as any);

      await addressesController.create(mockReq as Request, mockRes as Response);

      expect(statusStub).to.have.been.calledWith(201);
      expect(jsonSpy).to.have.been.calledWith(
        sinon.match({
          success: true,
          message: sinon.match(/created/),
          data: sinon.match({ id: 'new-addr' }),
        })
      );
    });
  });

  describe('update', function () {
    it('should update address', async function () {
      mockReq = {
        user: createMockUser(),
        params: { id: 'addr-123' },
        body: { label: 'Updated Home' },
      };

      const mockAddress = { id: 'addr-123', label: 'Updated Home' };
      sandbox.stub(addressesService, 'update').resolves(mockAddress as any);

      await addressesController.update(mockReq as Request, mockRes as Response);

      expect(jsonSpy).to.have.been.calledWith(
        sinon.match({
          success: true,
          message: sinon.match(/updated/),
          data: sinon.match({ label: 'Updated Home' }),
        })
      );
    });

    it('should return 404 for non-existent address', async function () {
      mockReq = {
        user: createMockUser(),
        params: { id: 'non-existent' },
        body: { label: 'Updated' },
      };

      sandbox.stub(addressesService, 'update').resolves(null);

      await addressesController.update(mockReq as Request, mockRes as Response);

      expect(statusStub).to.have.been.calledWith(404);
    });
  });

  describe('delete', function () {
    it('should delete address', async function () {
      mockReq = {
        user: createMockUser(),
        params: { id: 'addr-123' },
      };

      sandbox.stub(addressesService, 'delete').resolves(true);

      await addressesController.delete(mockReq as Request, mockRes as Response);

      expect(jsonSpy).to.have.been.calledWith(
        sinon.match({
          success: true,
          message: sinon.match(/deleted/),
        })
      );
    });

    it('should return 404 for non-existent address', async function () {
      mockReq = {
        user: createMockUser(),
        params: { id: 'non-existent' },
      };

      sandbox.stub(addressesService, 'delete').resolves(false);

      await addressesController.delete(mockReq as Request, mockRes as Response);

      expect(statusStub).to.have.been.calledWith(404);
    });
  });

  describe('setDefault', function () {
    it('should set address as default', async function () {
      mockReq = {
        user: createMockUser(),
        params: { id: 'addr-123' },
      };

      const mockAddress = { id: 'addr-123', is_default: true };
      sandbox.stub(addressesService, 'setDefault').resolves(mockAddress as any);

      await addressesController.setDefault(mockReq as Request, mockRes as Response);

      expect(jsonSpy).to.have.been.calledWith(
        sinon.match({
          success: true,
          message: sinon.match(/Default address updated/),
          data: sinon.match({ is_default: true }),
        })
      );
    });

    it('should return 404 for non-existent address', async function () {
      mockReq = {
        user: createMockUser(),
        params: { id: 'non-existent' },
      };

      sandbox.stub(addressesService, 'setDefault').resolves(null);

      await addressesController.setDefault(mockReq as Request, mockRes as Response);

      expect(statusStub).to.have.been.calledWith(404);
    });
  });
});
