import { expect } from 'chai';
import sinon from 'sinon';
import { Request, Response } from 'express';
import savedItemsController from '../../../src/controllers/savedItems';
import savedItemsService from '../../../src/services/savedItems';
import { createMockUser } from '../../helpers';

describe('SavedItems Controller', function () {
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

  describe('saveItem', function () {
    it('should save an item', async function () {
      mockReq = {
        user: createMockUser(),
        params: { itemId: 'item-123' },
      };

      sandbox.stub(savedItemsService, 'saveItem').resolves({
        savedItem: { id: 'saved-1' } as any,
        alreadySaved: false,
        itemNotFound: false,
      });

      await savedItemsController.saveItem(mockReq as Request, mockRes as Response);

      expect(statusStub).to.have.been.calledWith(201);
      expect(jsonSpy).to.have.been.calledWith(
        sinon.match({
          success: true,
          message: sinon.match(/saved successfully/),
          data: { saved: true },
        })
      );
    });

    it('should return 200 if already saved', async function () {
      mockReq = {
        user: createMockUser(),
        params: { itemId: 'item-123' },
      };

      sandbox.stub(savedItemsService, 'saveItem').resolves({
        savedItem: { id: 'saved-1' } as any,
        alreadySaved: true,
        itemNotFound: false,
      });

      await savedItemsController.saveItem(mockReq as Request, mockRes as Response);

      expect(statusStub).to.have.been.calledWith(200);
      expect(jsonSpy).to.have.been.calledWith(
        sinon.match({
          success: true,
          message: sinon.match(/already saved/),
        })
      );
    });

    it('should return 404 if item not found', async function () {
      mockReq = {
        user: createMockUser(),
        params: { itemId: 'non-existent' },
      };

      sandbox.stub(savedItemsService, 'saveItem').resolves({
        savedItem: null,
        alreadySaved: false,
        itemNotFound: true,
      });

      await savedItemsController.saveItem(mockReq as Request, mockRes as Response);

      expect(statusStub).to.have.been.calledWith(404);
      expect(jsonSpy).to.have.been.calledWith(
        sinon.match({
          success: false,
          message: 'Item not found',
        })
      );
    });
  });

  describe('unsaveItem', function () {
    it('should unsave an item', async function () {
      mockReq = {
        user: createMockUser(),
        params: { itemId: 'item-123' },
      };

      sandbox.stub(savedItemsService, 'unsaveItem').resolves({
        success: true,
        notFound: false,
      });

      await savedItemsController.unsaveItem(mockReq as Request, mockRes as Response);

      expect(jsonSpy).to.have.been.calledWith(
        sinon.match({
          success: true,
          message: sinon.match(/removed from saved/),
          data: { saved: false },
        })
      );
    });

    it('should return 404 if saved item not found', async function () {
      mockReq = {
        user: createMockUser(),
        params: { itemId: 'non-existent' },
      };

      sandbox.stub(savedItemsService, 'unsaveItem').resolves({
        success: false,
        notFound: true,
      });

      await savedItemsController.unsaveItem(mockReq as Request, mockRes as Response);

      expect(statusStub).to.have.been.calledWith(404);
    });
  });

  describe('checkSaved', function () {
    it('should return saved true if item is saved', async function () {
      mockReq = {
        user: createMockUser(),
        params: { itemId: 'item-123' },
      };

      sandbox.stub(savedItemsService, 'isItemSaved').resolves(true);

      await savedItemsController.checkSaved(mockReq as Request, mockRes as Response);

      expect(jsonSpy).to.have.been.calledWith(
        sinon.match({
          success: true,
          data: { saved: true },
        })
      );
    });

    it('should return saved false if item is not saved', async function () {
      mockReq = {
        user: createMockUser(),
        params: { itemId: 'item-123' },
      };

      sandbox.stub(savedItemsService, 'isItemSaved').resolves(false);

      await savedItemsController.checkSaved(mockReq as Request, mockRes as Response);

      expect(jsonSpy).to.have.been.calledWith(
        sinon.match({
          success: true,
          data: { saved: false },
        })
      );
    });
  });

  describe('getSavedItems', function () {
    it('should return saved items with pagination', async function () {
      mockReq = {
        user: createMockUser(),
        query: {},
      };

      const mockResult = {
        items: [{ id: 'item-1' }, { id: 'item-2' }],
        pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
      };
      sandbox.stub(savedItemsService, 'getSavedItems').resolves(mockResult as any);

      await savedItemsController.getSavedItems(mockReq as Request, mockRes as Response);

      expect(jsonSpy).to.have.been.calledWith(
        sinon.match({
          success: true,
          data: sinon.match.array,
          pagination: sinon.match.object,
        })
      );
    });

    it('should handle pagination params', async function () {
      mockReq = {
        user: createMockUser(),
        query: { page: '2', limit: '10' },
      };

      const getSavedItemsStub = sandbox.stub(savedItemsService, 'getSavedItems').resolves({
        items: [],
        pagination: { page: 2, limit: 10, total: 0, totalPages: 0 },
      } as any);

      await savedItemsController.getSavedItems(mockReq as Request, mockRes as Response);

      expect(getSavedItemsStub).to.have.been.calledWith('user-123', 2, 10);
    });
  });

  describe('getSavedItemIds', function () {
    it('should return array of saved item ids', async function () {
      mockReq = {
        user: createMockUser(),
      };

      sandbox.stub(savedItemsService, 'getSavedItemIds').resolves(['item-1', 'item-2', 'item-3']);

      await savedItemsController.getSavedItemIds(mockReq as Request, mockRes as Response);

      expect(jsonSpy).to.have.been.calledWith(
        sinon.match({
          success: true,
          data: ['item-1', 'item-2', 'item-3'],
        })
      );
    });
  });
});
