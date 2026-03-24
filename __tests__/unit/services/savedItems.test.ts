import { expect } from 'chai';
import sinon from 'sinon';
import { SavedItem, Item, User } from '../../../src/models';
import savedItemsService from '../../../src/services/savedItems';

describe('SavedItems Service', function () {
  let sandbox: sinon.SinonSandbox;

  beforeEach(function () {
    sandbox = sinon.createSandbox();
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('saveItem', function () {
    it('should save an item', async function () {
      const mockItem = { id: 'item-123' };
      const mockSavedItem = { id: 'saved-1', user_id: 'user-123', item_id: 'item-123' };
      
      sandbox.stub(Item, 'findByPk').resolves(mockItem as Item);
      sandbox.stub(SavedItem, 'findOne').resolves(null);
      sandbox.stub(SavedItem, 'create').resolves(mockSavedItem as unknown as SavedItem);

      const result = await savedItemsService.saveItem('user-123', 'item-123');

      expect(result.savedItem).to.not.be.null;
      expect(result.alreadySaved).to.be.false;
      expect(result.itemNotFound).to.be.false;
    });

    it('should return alreadySaved if item already saved', async function () {
      const mockItem = { id: 'item-123' };
      const existingSavedItem = { id: 'saved-1', user_id: 'user-123', item_id: 'item-123' };
      
      sandbox.stub(Item, 'findByPk').resolves(mockItem as Item);
      sandbox.stub(SavedItem, 'findOne').resolves(existingSavedItem as unknown as SavedItem);

      const result = await savedItemsService.saveItem('user-123', 'item-123');

      expect(result.alreadySaved).to.be.true;
      expect(result.itemNotFound).to.be.false;
    });

    it('should return itemNotFound if item does not exist', async function () {
      sandbox.stub(Item, 'findByPk').resolves(null);

      const result = await savedItemsService.saveItem('user-123', 'non-existent');

      expect(result.savedItem).to.be.null;
      expect(result.itemNotFound).to.be.true;
    });
  });

  describe('unsaveItem', function () {
    it('should unsave an item', async function () {
      const mockSavedItem = {
        id: 'saved-1',
        user_id: 'user-123',
        item_id: 'item-123',
        destroy: sandbox.stub().resolves(),
      };
      sandbox.stub(SavedItem, 'findOne').resolves(mockSavedItem as unknown as SavedItem);

      const result = await savedItemsService.unsaveItem('user-123', 'item-123');

      expect(result.success).to.be.true;
      expect(result.notFound).to.be.false;
      expect(mockSavedItem.destroy).to.have.been.called;
    });

    it('should return notFound if saved item does not exist', async function () {
      sandbox.stub(SavedItem, 'findOne').resolves(null);

      const result = await savedItemsService.unsaveItem('user-123', 'item-123');

      expect(result.success).to.be.false;
      expect(result.notFound).to.be.true;
    });
  });

  describe('isItemSaved', function () {
    it('should return true if item is saved', async function () {
      const mockSavedItem = { id: 'saved-1', user_id: 'user-123', item_id: 'item-123' };
      sandbox.stub(SavedItem, 'findOne').resolves(mockSavedItem as unknown as SavedItem);

      const result = await savedItemsService.isItemSaved('user-123', 'item-123');

      expect(result).to.be.true;
    });

    it('should return false if item is not saved', async function () {
      sandbox.stub(SavedItem, 'findOne').resolves(null);

      const result = await savedItemsService.isItemSaved('user-123', 'item-123');

      expect(result).to.be.false;
    });
  });

  describe('getSavedItems', function () {
    it('should return saved items with pagination', async function () {
      const mockSavedItems = [
        {
          id: 'saved-1',
          item: { id: 'item-1', title: 'Item 1' },
        },
        {
          id: 'saved-2',
          item: { id: 'item-2', title: 'Item 2' },
        },
      ];
      sandbox.stub(SavedItem, 'findAndCountAll').resolves({
        rows: mockSavedItems as unknown as SavedItem[],
        count: 2,
      } as any);

      const result = await savedItemsService.getSavedItems('user-123', 1, 20);

      expect(result.items).to.have.length(2);
      expect(result.pagination.total).to.equal(2);
      expect(result.pagination.page).to.equal(1);
      expect(result.pagination.limit).to.equal(20);
    });

    it('should filter out undefined items', async function () {
      const mockSavedItems = [
        { id: 'saved-1', item: { id: 'item-1', title: 'Item 1' } },
        { id: 'saved-2', item: undefined },
      ];
      sandbox.stub(SavedItem, 'findAndCountAll').resolves({
        rows: mockSavedItems as unknown as SavedItem[],
        count: 2,
      } as any);

      const result = await savedItemsService.getSavedItems('user-123');

      expect(result.items).to.have.length(1);
    });

    it('should use default pagination values', async function () {
      const findAndCountAllStub = sandbox.stub(SavedItem, 'findAndCountAll').resolves({
        rows: [] as SavedItem[],
        count: 0,
      } as any);

      await savedItemsService.getSavedItems('user-123');

      const callArgs = findAndCountAllStub.firstCall.args[0];
      expect(callArgs?.limit).to.equal(20);
      expect(callArgs?.offset).to.equal(0);
    });
  });

  describe('getSavedItemIds', function () {
    it('should return array of saved item ids', async function () {
      const mockSavedItems = [
        { item_id: 'item-1' },
        { item_id: 'item-2' },
        { item_id: 'item-3' },
      ];
      sandbox.stub(SavedItem, 'findAll').resolves(mockSavedItems as unknown as SavedItem[]);

      const result = await savedItemsService.getSavedItemIds('user-123');

      expect(result).to.deep.equal(['item-1', 'item-2', 'item-3']);
    });

    it('should return empty array for user with no saved items', async function () {
      sandbox.stub(SavedItem, 'findAll').resolves([]);

      const result = await savedItemsService.getSavedItemIds('user-123');

      expect(result).to.deep.equal([]);
    });
  });
});
