import { expect } from 'chai';
import request from 'supertest';
import app from '../../src/index';
import { User, Item, Claim, Notification } from '../../src/models';
import { generateToken } from '../../src/middlewares/auth';

describe('Claims API', function () {
  this.timeout(15000);

  let owner: User;
  let finder: User;
  let otherUser: User;
  let ownerToken: string;
  let finderToken: string;
  let otherToken: string;
  let item: Item;

  beforeEach(async function () {
    await Notification.destroy({ where: {}, force: true });
    await Claim.destroy({ where: {}, force: true });
    await Item.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });

    const bcrypt = await import('bcrypt');
    const hash = await bcrypt.hash('password123', 10);

    owner = await User.create({
      name: 'Item Owner',
      email: 'owner@test.com',
      password_hash: hash,
      phone: '9876543210',
      rating: 0,
      role: 'user',
    });

    finder = await User.create({
      name: 'Item Finder',
      email: 'finder@test.com',
      password_hash: hash,
      rating: 0,
      role: 'user',
    });

    otherUser = await User.create({
      name: 'Other User',
      email: 'other@test.com',
      password_hash: hash,
      rating: 0,
      role: 'user',
    });

    ownerToken = generateToken({ id: owner.id, email: owner.email });
    finderToken = generateToken({ id: finder.id, email: finder.email });
    otherToken = generateToken({ id: otherUser.id, email: otherUser.email });

    item = await Item.create({
      user_id: owner.id,
      type: 'lost',
      status: 'open',
      title: 'Lost Wallet',
      description: 'A brown leather wallet',
      image_urls: [],
    });
  });

  describe('POST /api/claims', function () {
    it('should create a claim successfully (201)', async function () {
      const res = await request(app)
        .post('/api/claims')
        .set('Authorization', `Bearer ${finderToken}`)
        .send({
          item_id: item.id,
          proof_description: 'I found this wallet near the park bench',
        });

      expect(res.status).to.equal(201);
      expect(res.body.success).to.be.true;
      expect(res.body.claim).to.have.property('id');
      expect(res.body.claim.status).to.equal('pending');
      expect(res.body.claim.claimant_id).to.equal(finder.id);
    });

    it('should return 403 when claiming own item', async function () {
      const res = await request(app)
        .post('/api/claims')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          item_id: item.id,
          proof_description: 'Trying to claim my own item for some reason',
        });

      expect(res.status).to.equal(403);
      expect(res.body.message).to.include('cannot claim your own item');
    });

    it('should return 409 for duplicate active claim', async function () {
      await request(app)
        .post('/api/claims')
        .set('Authorization', `Bearer ${finderToken}`)
        .send({
          item_id: item.id,
          proof_description: 'First claim with proof details here',
        });

      const res = await request(app)
        .post('/api/claims')
        .set('Authorization', `Bearer ${finderToken}`)
        .send({
          item_id: item.id,
          proof_description: 'Trying to claim the same item again',
        });

      expect(res.status).to.equal(409);
      expect(res.body.message).to.include('already have an active claim');
    });

    it('should return 400 when item is not open', async function () {
      await item.update({ status: 'claimed' });

      const res = await request(app)
        .post('/api/claims')
        .set('Authorization', `Bearer ${finderToken}`)
        .send({
          item_id: item.id,
          proof_description: 'Trying to claim a non-open item',
        });

      expect(res.status).to.equal(400);
      expect(res.body.message).to.include('not open');
    });

    it('should return 401 without token', async function () {
      const res = await request(app)
        .post('/api/claims')
        .send({
          item_id: item.id,
          proof_description: 'No auth token provided here',
        });

      expect(res.status).to.equal(401);
    });
  });

  describe('PATCH /api/claims/:id/accept', function () {
    let claim: Claim;
    let otherClaim: Claim;

    beforeEach(async function () {
      claim = await Claim.create({
        item_id: item.id,
        claimant_id: finder.id,
        status: 'pending',
        proof_description: 'Found it near the park',
        proof_images: [],
      });

      otherClaim = await Claim.create({
        item_id: item.id,
        claimant_id: otherUser.id,
        status: 'pending',
        proof_description: 'I also found this item',
        proof_images: [],
      });
    });

    it('should accept a claim and auto-reject others', async function () {
      const res = await request(app)
        .patch(`/api/claims/${claim.id}/accept`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.claim.status).to.equal('accepted');

      const rejectedClaim = await Claim.findByPk(otherClaim.id);
      expect(rejectedClaim!.status).to.equal('rejected');

      const updatedItem = await Item.findByPk(item.id);
      expect(updatedItem!.status).to.equal('claimed');
    });

    it('should return 403 when non-owner tries to accept', async function () {
      const res = await request(app)
        .patch(`/api/claims/${claim.id}/accept`)
        .set('Authorization', `Bearer ${finderToken}`);

      expect(res.status).to.equal(403);
    });

    it('should return 401 without token', async function () {
      const res = await request(app)
        .patch(`/api/claims/${claim.id}/accept`);

      expect(res.status).to.equal(401);
    });
  });

  describe('PATCH /api/claims/:id/reject', function () {
    let claim: Claim;

    beforeEach(async function () {
      claim = await Claim.create({
        item_id: item.id,
        claimant_id: finder.id,
        status: 'pending',
        proof_description: 'Found it near the park',
        proof_images: [],
      });
    });

    it('should reject a claim successfully', async function () {
      const res = await request(app)
        .patch(`/api/claims/${claim.id}/reject`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.claim.status).to.equal('rejected');
    });

    it('should return 401 without token', async function () {
      const res = await request(app)
        .patch(`/api/claims/${claim.id}/reject`);

      expect(res.status).to.equal(401);
    });
  });

  describe('PATCH /api/claims/:id/resolve', function () {
    let claim: Claim;

    beforeEach(async function () {
      claim = await Claim.create({
        item_id: item.id,
        claimant_id: finder.id,
        status: 'accepted',
        proof_description: 'Found it near the park',
        proof_images: [],
      });
      await item.update({ status: 'claimed' });
    });

    it('should resolve a claim by the owner', async function () {
      const res = await request(app)
        .patch(`/api/claims/${claim.id}/resolve`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.claim.status).to.equal('resolved');

      const updatedItem = await Item.findByPk(item.id);
      expect(updatedItem!.status).to.equal('resolved');
    });

    it('should resolve a claim by the claimant', async function () {
      const res = await request(app)
        .patch(`/api/claims/${claim.id}/resolve`)
        .set('Authorization', `Bearer ${finderToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.claim.status).to.equal('resolved');
    });

    it('should return 401 without token', async function () {
      const res = await request(app)
        .patch(`/api/claims/${claim.id}/resolve`);

      expect(res.status).to.equal(401);
    });
  });

  describe('GET /api/claims/mine', function () {
    it('should return 401 without token', async function () {
      const res = await request(app)
        .get('/api/claims/mine');

      expect(res.status).to.equal(401);
    });
  });

  describe('GET /api/claims/on-my-items', function () {
    it('should return 401 without token', async function () {
      const res = await request(app)
        .get('/api/claims/on-my-items');

      expect(res.status).to.equal(401);
    });
  });

  describe('GET /api/claims/:id', function () {
    it('should return 401 without token', async function () {
      const res = await request(app)
        .get('/api/claims/some-id');

      expect(res.status).to.equal(401);
    });
  });
});
