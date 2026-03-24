import { expect } from 'chai';
import sinon from 'sinon';
import { Request, Response } from 'express';
import itemsController from '../../../src/controllers/items';
import itemsService from '../../../src/services/items';
import { createMockUser } from '../../helpers';

describe('Items Controller', function () {
  let sandbox: sinon.SinonSandbox;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonSpy: sinon.SinonSpy;
  let statusStub: sinon.SinonStub;
  let sendSpy: sinon.SinonSpy;

  beforeEach(function () {
    sandbox = sinon.createSandbox();
    jsonSpy = sandbox.spy();
    sendSpy = sandbox.spy();
    statusStub = sandbox.stub().returns({ json: jsonSpy, send: sendSpy });
    mockRes = {
      json: jsonSpy,
      status: statusStub,
    };
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('list', function () {
    it('should return list of items', async function () {
      mockReq = {
        query: {},
      };

      const mockResult = {
        items: [
          { id: 'item-1', title: 'Item 1' },
          { id: 'item-2', title: 'Item 2' },
        ],
        pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
      };

      sandbox.stub(itemsService, 'findAll').resolves(mockResult as any);

      await itemsController.list(mockReq as Request, mockRes as Response);

      expect(jsonSpy).to.have.been.calledWith(
        sinon.match({
          success: true,
          data: sinon.match.array,
          pagination: sinon.match.object,
        })
      );
    });

    it('should handle filters', async function () {
      mockReq = {
        query: {
          type: 'lost',
          category: 'electronics',
          page: '2',
          limit: '10',
        },
      };

      const findAllStub = sandbox.stub(itemsService, 'findAll').resolves({
        items: [],
        pagination: { page: 2, limit: 10, total: 0, totalPages: 0 },
      } as any);

      await itemsController.list(mockReq as Request, mockRes as Response);

      expect(findAllStub).to.have.been.calledWith(
        sinon.match({
          type: 'lost',
          category: 'electronics',
          page: 2,
          limit: 10,
        })
      );
    });

    it('should handle geo filters', async function () {
      mockReq = {
        query: {
          lat: '12.9716',
          lng: '77.5946',
          radius: '5000',
        },
      };

      const findAllStub = sandbox.stub(itemsService, 'findAll').resolves({
        items: [],
        pagination: null,
      } as any);

      await itemsController.list(mockReq as Request, mockRes as Response);

      expect(findAllStub).to.have.been.calledWith(
        sinon.match({
          lat: 12.9716,
          lng: 77.5946,
          radius: 5000,
        })
      );
    });
  });

  describe('get', function () {
    it('should return item by id', async function () {
      mockReq = {
        params: { id: 'item-123' },
      };

      const mockItem = { id: 'item-123', title: 'Test Item' };
      sandbox.stub(itemsService, 'findById').resolves(mockItem as any);

      await itemsController.get(mockReq as Request, mockRes as Response);

      expect(jsonSpy).to.have.been.calledWith(
        sinon.match({
          success: true,
          data: sinon.match({ id: 'item-123' }),
        })
      );
    });

    it('should return 404 for non-existent item', async function () {
      mockReq = {
        params: { id: 'non-existent' },
      };

      sandbox.stub(itemsService, 'findById').resolves(null);

      await itemsController.get(mockReq as Request, mockRes as Response);

      expect(statusStub).to.have.been.calledWith(404);
      expect(jsonSpy).to.have.been.calledWith(
        sinon.match({
          success: false,
          message: 'Item not found',
        })
      );
    });
  });

  describe('create', function () {
    it('should create a new item', async function () {
      mockReq = {
        user: createMockUser(),
        body: {
          type: 'lost',
          title: 'Lost Wallet',
          description: 'Black leather wallet',
        },
      };

      const mockItem = {
        id: 'new-item',
        type: 'lost',
        title: 'Lost Wallet',
      };
      sandbox.stub(itemsService, 'create').resolves(mockItem as any);

      await itemsController.create(mockReq as Request, mockRes as Response);

      expect(statusStub).to.have.been.calledWith(201);
      expect(jsonSpy).to.have.been.calledWith(
        sinon.match({ item: sinon.match({ id: 'new-item' }) })
      );
    });
  });

  describe('update', function () {
    it('should update item for owner', async function () {
      mockReq = {
        params: { id: 'item-123' },
        user: createMockUser(),
        body: { title: 'Updated Title' },
      };

      sandbox.stub(itemsService, 'update').resolves({
        item: { id: 'item-123', title: 'Updated Title' },
        notFound: false,
        forbidden: false,
      } as any);

      await itemsController.update(mockReq as Request, mockRes as Response);

      expect(jsonSpy).to.have.been.calledWith(
        sinon.match({
          success: true,
          item: sinon.match({ title: 'Updated Title' }),
        })
      );
    });

    it('should return 404 for non-existent item', async function () {
      mockReq = {
        params: { id: 'non-existent' },
        user: createMockUser(),
        body: { title: 'Updated Title' },
      };

      sandbox.stub(itemsService, 'update').resolves({
        item: null,
        notFound: true,
        forbidden: false,
      });

      await itemsController.update(mockReq as Request, mockRes as Response);

      expect(statusStub).to.have.been.calledWith(404);
    });

    it('should return 403 for non-owner', async function () {
      mockReq = {
        params: { id: 'item-123' },
        user: createMockUser({ id: 'other-user' }),
        body: { title: 'Updated Title' },
      };

      sandbox.stub(itemsService, 'update').resolves({
        item: null,
        notFound: false,
        forbidden: true,
      });

      await itemsController.update(mockReq as Request, mockRes as Response);

      expect(statusStub).to.have.been.calledWith(403);
    });
  });

  describe('resolve', function () {
    it('should resolve item for owner', async function () {
      mockReq = {
        params: { id: 'item-123' },
        user: createMockUser(),
      };

      sandbox.stub(itemsService, 'resolve').resolves({
        item: { id: 'item-123', status: 'resolved' },
        notFound: false,
        forbidden: false,
      } as any);

      await itemsController.resolve(mockReq as Request, mockRes as Response);

      expect(jsonSpy).to.have.been.calledWith(
        sinon.match({
          success: true,
          message: sinon.match(/resolved/),
        })
      );
    });

    it('should return 403 for non-owner', async function () {
      mockReq = {
        params: { id: 'item-123' },
        user: createMockUser({ id: 'other-user' }),
      };

      sandbox.stub(itemsService, 'resolve').resolves({
        item: null,
        notFound: false,
        forbidden: true,
      });

      await itemsController.resolve(mockReq as Request, mockRes as Response);

      expect(statusStub).to.have.been.calledWith(403);
    });
  });

  describe('delete', function () {
    it('should delete item for owner', async function () {
      mockReq = {
        params: { id: 'item-123' },
        user: createMockUser(),
      };
      mockRes = {
        ...mockRes,
        status: sandbox.stub().returns({ send: sendSpy }),
      };

      sandbox.stub(itemsService, 'delete').resolves({
        success: true,
        notFound: false,
        forbidden: false,
      });

      await itemsController.delete(mockReq as Request, mockRes as Response);

      expect(mockRes.status).to.have.been.calledWith(204);
      expect(sendSpy).to.have.been.called;
    });

    it('should return 403 for non-owner', async function () {
      mockReq = {
        params: { id: 'item-123' },
        user: createMockUser({ id: 'other-user' }),
      };

      sandbox.stub(itemsService, 'delete').resolves({
        success: false,
        notFound: false,
        forbidden: true,
      });

      await itemsController.delete(mockReq as Request, mockRes as Response);

      expect(statusStub).to.have.been.calledWith(403);
    });
  });

  describe('listUserItems', function () {
    it('should return user items', async function () {
      mockReq = {
        user: createMockUser(),
        query: {},
      };

      const mockResult = {
        items: [{ id: 'item-1', user_id: 'user-123' }],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      };

      sandbox.stub(itemsService, 'findByUser').resolves(mockResult as any);

      await itemsController.listUserItems(mockReq as Request, mockRes as Response);

      expect(jsonSpy).to.have.been.calledWith(
        sinon.match({
          success: true,
          items: sinon.match.array,
          pagination: sinon.match.object,
        })
      );
    });

    it('should handle filters', async function () {
      mockReq = {
        user: createMockUser(),
        query: { type: 'lost', status: 'open' },
      };

      const findByUserStub = sandbox.stub(itemsService, 'findByUser').resolves({
        items: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      } as any);

      await itemsController.listUserItems(mockReq as Request, mockRes as Response);

      expect(findByUserStub).to.have.been.calledWith(
        'user-123',
        sinon.match({ type: 'lost', status: 'open' })
      );
    });
  });
});
