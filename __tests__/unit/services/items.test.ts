import { expect } from 'chai';
import sinon from 'sinon';
import { Item, User, sequelize } from '../../../src/models';
import itemsService from '../../../src/services/items';

describe('Items Service', function () {
  let sandbox: sinon.SinonSandbox;

  beforeEach(function () {
    sandbox = sinon.createSandbox();
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('create', function () {
    it('should create an item without location', async function () {
      const mockItem = {
        id: 'item-123',
        user_id: 'user-123',
        type: 'lost',
        title: 'Lost Wallet',
        description: 'Black leather wallet',
      };
      sandbox.stub(Item, 'create').resolves(mockItem as unknown as Item);
      sandbox.stub(Item, 'findByPk').resolves(mockItem as unknown as Item);
      sandbox.stub(sequelize, 'query').resolves();

      const result = await itemsService.create(
        {
          type: 'lost',
          title: 'Lost Wallet',
          description: 'Black leather wallet',
          category: 'wallet',
          lat: 12.9716,
          lng: 77.5946,
          location_name: 'Test Location',
          lost_found_at: new Date(),
        },
        'user-123'
      );

      expect(result).to.not.be.null;
      expect(result!.title).to.equal('Lost Wallet');
    });

    it('should create an item with location', async function () {
      const mockItem = {
        id: 'item-123',
        user_id: 'user-123',
        type: 'lost',
        title: 'Lost Wallet',
      };
      sandbox.stub(Item, 'create').resolves(mockItem as unknown as Item);
      sandbox.stub(Item, 'findByPk').resolves(mockItem as unknown as Item);
      const queryStub = sandbox.stub(sequelize, 'query').resolves();

      await itemsService.create(
        {
          type: 'lost',
          title: 'Lost Wallet',
          description: 'A wallet',
          category: 'wallet',
          lat: 12.9716,
          lng: 77.5946,
          location_name: 'Test Location',
          lost_found_at: new Date(),
        },
        'user-123'
      );

      expect(queryStub).to.have.been.called;
    });
  });

  describe('findById', function () {
    it('should find item by id with owner', async function () {
      const mockItem = {
        id: 'item-123',
        title: 'Test Item',
        owner: { id: 'user-123', name: 'Test User' },
      };
      sandbox.stub(Item, 'findByPk').resolves(mockItem as unknown as Item);

      const result = await itemsService.findById('item-123');

      expect(result).to.not.be.null;
      expect(result!.id).to.equal('item-123');
    });

    it('should return null for non-existent item', async function () {
      sandbox.stub(Item, 'findByPk').resolves(null);

      const result = await itemsService.findById('non-existent');

      expect(result).to.be.null;
    });
  });

  describe('findByIdWithOwnerCheck', function () {
    it('should return item and isOwner true for owner', async function () {
      const mockItem = {
        id: 'item-123',
        user_id: 'user-123',
      };
      sandbox.stub(Item, 'findByPk').resolves(mockItem as unknown as Item);

      const result = await itemsService.findByIdWithOwnerCheck('item-123', 'user-123');

      expect(result.item).to.not.be.null;
      expect(result.isOwner).to.be.true;
    });

    it('should return isOwner false for non-owner', async function () {
      const mockItem = {
        id: 'item-123',
        user_id: 'user-123',
      };
      sandbox.stub(Item, 'findByPk').resolves(mockItem as unknown as Item);

      const result = await itemsService.findByIdWithOwnerCheck('item-123', 'other-user');

      expect(result.item).to.not.be.null;
      expect(result.isOwner).to.be.false;
    });

    it('should return null item for non-existent item', async function () {
      sandbox.stub(Item, 'findByPk').resolves(null);

      const result = await itemsService.findByIdWithOwnerCheck('non-existent', 'user-123');

      expect(result.item).to.be.null;
      expect(result.isOwner).to.be.false;
    });
  });

  describe('findAll', function () {
    it('should find all items with default filters', async function () {
      const mockItems = [
        { id: 'item-1', title: 'Item 1' },
        { id: 'item-2', title: 'Item 2' },
      ];
      sandbox.stub(Item, 'findAndCountAll').resolves({
        rows: mockItems as Item[],
        count: 2,
      } as any);

      const result = await itemsService.findAll();

      expect(result.items).to.have.length(2);
      expect(result.pagination).to.not.be.null;
      expect(result.pagination!.total).to.equal(2);
    });

    it('should filter by type', async function () {
      const findAndCountAllStub = sandbox.stub(Item, 'findAndCountAll').resolves({
        rows: [] as Item[],
        count: 0,
      } as any);

      await itemsService.findAll({ type: 'lost' });

      const callArgs = findAndCountAllStub.firstCall.args[0];
      expect(callArgs?.where).to.have.property('type', 'lost');
    });

    it('should filter by category', async function () {
      const findAndCountAllStub = sandbox.stub(Item, 'findAndCountAll').resolves({
        rows: [] as Item[],
        count: 0,
      } as any);

      await itemsService.findAll({ category: 'electronics' });

      const callArgs = findAndCountAllStub.firstCall.args[0];
      expect(callArgs?.where).to.have.property('category', 'electronics');
    });

    it('should handle pagination', async function () {
      const findAndCountAllStub = sandbox.stub(Item, 'findAndCountAll').resolves({
        rows: [] as Item[],
        count: 100,
      } as any);

      const result = await itemsService.findAll({ page: 2, limit: 10 });

      const callArgs = findAndCountAllStub.firstCall.args[0];
      expect(callArgs?.limit).to.equal(10);
      expect(callArgs?.offset).to.equal(10);
      expect(result.pagination!.page).to.equal(2);
      expect(result.pagination!.totalPages).to.equal(10);
    });
  });

  describe('findByUser', function () {
    it('should find items by user id', async function () {
      const mockItems = [{ id: 'item-1', user_id: 'user-123' }];
      sandbox.stub(Item, 'findAndCountAll').resolves({
        rows: mockItems as Item[],
        count: 1,
      } as any);

      const result = await itemsService.findByUser('user-123');

      expect(result.items).to.have.length(1);
    });

    it('should filter by type and status', async function () {
      const findAndCountAllStub = sandbox.stub(Item, 'findAndCountAll').resolves({
        rows: [] as Item[],
        count: 0,
      } as any);

      await itemsService.findByUser('user-123', { type: 'lost', status: 'open' });

      const callArgs = findAndCountAllStub.firstCall.args[0];
      expect(callArgs?.where).to.have.property('user_id', 'user-123');
      expect(callArgs?.where).to.have.property('type', 'lost');
      expect(callArgs?.where).to.have.property('status', 'open');
    });
  });

  describe('update', function () {
    it('should update item for owner', async function () {
      const mockItem = {
        id: 'item-123',
        user_id: 'user-123',
        title: 'Old Title',
        update: sandbox.stub().resolves(),
      };
      sandbox.stub(Item, 'findByPk')
        .onFirstCall().resolves(mockItem as unknown as Item)
        .onSecondCall().resolves({ ...mockItem, title: 'New Title' } as unknown as Item);

      const result = await itemsService.update('item-123', 'user-123', { title: 'New Title' });

      expect(result.notFound).to.be.false;
      expect(result.forbidden).to.be.false;
      expect(mockItem.update).to.have.been.called;
    });

    it('should return forbidden for non-owner', async function () {
      const mockItem = {
        id: 'item-123',
        user_id: 'user-123',
      };
      sandbox.stub(Item, 'findByPk').resolves(mockItem as unknown as Item);

      const result = await itemsService.update('item-123', 'other-user', { title: 'New Title' });

      expect(result.forbidden).to.be.true;
      expect(result.item).to.be.null;
    });

    it('should return notFound for non-existent item', async function () {
      sandbox.stub(Item, 'findByPk').resolves(null);

      const result = await itemsService.update('non-existent', 'user-123', { title: 'New Title' });

      expect(result.notFound).to.be.true;
      expect(result.item).to.be.null;
    });
  });

  describe('resolve', function () {
    it('should resolve item for owner', async function () {
      const mockItem = {
        id: 'item-123',
        user_id: 'user-123',
        status: 'open',
        update: sandbox.stub().resolves(),
      };
      sandbox.stub(Item, 'findByPk')
        .onFirstCall().resolves(mockItem as unknown as Item)
        .onSecondCall().resolves({ ...mockItem, status: 'resolved' } as unknown as Item);

      const result = await itemsService.resolve('item-123', 'user-123');

      expect(result.notFound).to.be.false;
      expect(result.forbidden).to.be.false;
      expect(mockItem.update).to.have.been.calledWith({ status: 'resolved' });
    });

    it('should return forbidden for non-owner', async function () {
      const mockItem = {
        id: 'item-123',
        user_id: 'user-123',
      };
      sandbox.stub(Item, 'findByPk').resolves(mockItem as unknown as Item);

      const result = await itemsService.resolve('item-123', 'other-user');

      expect(result.forbidden).to.be.true;
    });
  });

  describe('delete', function () {
    it('should delete item for owner', async function () {
      const mockItem = {
        id: 'item-123',
        user_id: 'user-123',
        destroy: sandbox.stub().resolves(),
      };
      sandbox.stub(Item, 'findByPk').resolves(mockItem as unknown as Item);

      const result = await itemsService.delete('item-123', 'user-123');

      expect(result.success).to.be.true;
      expect(result.notFound).to.be.false;
      expect(result.forbidden).to.be.false;
      expect(mockItem.destroy).to.have.been.called;
    });

    it('should return forbidden for non-owner', async function () {
      const mockItem = {
        id: 'item-123',
        user_id: 'user-123',
      };
      sandbox.stub(Item, 'findByPk').resolves(mockItem as unknown as Item);

      const result = await itemsService.delete('item-123', 'other-user');

      expect(result.success).to.be.false;
      expect(result.forbidden).to.be.true;
    });

    it('should return notFound for non-existent item', async function () {
      sandbox.stub(Item, 'findByPk').resolves(null);

      const result = await itemsService.delete('non-existent', 'user-123');

      expect(result.success).to.be.false;
      expect(result.notFound).to.be.true;
    });
  });
});
