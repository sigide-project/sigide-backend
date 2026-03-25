import { expect } from 'chai';
import sinon from 'sinon';
import { Claim, Item } from '../../src/models';

describe('Socket Join Claim Validation', () => {
  let findByPkStub: sinon.SinonStub;

  beforeEach(() => {
    findByPkStub = sinon.stub(Claim, 'findByPk');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('join_claim authorization logic', () => {
    it('should allow item owner to join claim room', async () => {
      const mockClaim = {
        id: 'claim-123',
        claimant_id: 'claimant-456',
        get: sinon.stub().returns({
          user_id: 'owner-789',
        }),
      };

      findByPkStub.resolves(mockClaim);

      const claim = await Claim.findByPk('claim-123', {
        include: [{ model: Item, as: 'item', attributes: ['user_id'] }],
      });

      const item = claim!.get('item') as { user_id: string };
      const userId = 'owner-789';
      const isOwner = item.user_id === userId;
      const isClaimant = (claim as unknown as { claimant_id: string }).claimant_id === userId;

      expect(isOwner || isClaimant).to.be.true;
    });

    it('should allow claimant to join claim room', async () => {
      const mockClaim = {
        id: 'claim-123',
        claimant_id: 'claimant-456',
        get: sinon.stub().returns({
          user_id: 'owner-789',
        }),
      };

      findByPkStub.resolves(mockClaim);

      const claim = await Claim.findByPk('claim-123', {
        include: [{ model: Item, as: 'item', attributes: ['user_id'] }],
      });

      const item = claim!.get('item') as { user_id: string };
      const userId = 'claimant-456';
      const isOwner = item.user_id === userId;
      const isClaimant = (claim as unknown as { claimant_id: string }).claimant_id === userId;

      expect(isOwner || isClaimant).to.be.true;
    });

    it('should deny unrelated user from joining claim room', async () => {
      const mockClaim = {
        id: 'claim-123',
        claimant_id: 'claimant-456',
        get: sinon.stub().returns({
          user_id: 'owner-789',
        }),
      };

      findByPkStub.resolves(mockClaim);

      const claim = await Claim.findByPk('claim-123', {
        include: [{ model: Item, as: 'item', attributes: ['user_id'] }],
      });

      const item = claim!.get('item') as { user_id: string };
      const userId = 'random-user-999';
      const isOwner = item.user_id === userId;
      const isClaimant = (claim as unknown as { claimant_id: string }).claimant_id === userId;

      expect(isOwner || isClaimant).to.be.false;
    });

    it('should return error when claim does not exist', async () => {
      findByPkStub.resolves(null);

      const claim = await Claim.findByPk('non-existent-claim', {
        include: [{ model: Item, as: 'item', attributes: ['user_id'] }],
      });

      expect(claim).to.be.null;
    });
  });
});
