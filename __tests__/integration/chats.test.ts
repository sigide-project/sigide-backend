import { expect } from 'chai';
import request from 'supertest';
import app from '../../src/index';
import { User, Item, Claim, Message, ChatDeletion, Notification } from '../../src/models';
import { generateToken } from '../../src/middlewares/auth';

describe('Chats API', function () {
  this.timeout(15000);

  let owner: User;
  let claimant: User;
  let otherUser: User;
  let ownerToken: string;
  let claimantToken: string;
  let otherToken: string;
  let item: Item;
  let claim: Claim;

  beforeEach(async function () {
    await ChatDeletion.destroy({ where: {}, force: true });
    await Message.destroy({ where: {}, force: true });
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

    claimant = await User.create({
      name: 'Claimant User',
      email: 'claimant@test.com',
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
    claimantToken = generateToken({ id: claimant.id, email: claimant.email });
    otherToken = generateToken({ id: otherUser.id, email: otherUser.email });

    item = await Item.create({
      user_id: owner.id,
      type: 'lost',
      status: 'open',
      title: 'Lost Wallet',
      description: 'A brown leather wallet',
      image_urls: ['https://example.com/wallet.jpg'],
      location_name: 'Central Park',
    });

    claim = await Claim.create({
      item_id: item.id,
      claimant_id: claimant.id,
      status: 'pending',
      proof_description: 'I found this wallet',
    });
  });

  describe('GET /api/claims/my-chats', function () {
    it('should return chats where user is claimant (200)', async function () {
      await Message.create({
        claim_id: claim.id,
        sender_id: owner.id,
        content: 'Hello, is this your wallet?',
      });

      const res = await request(app)
        .get('/api/claims/my-chats')
        .set('Authorization', `Bearer ${claimantToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.chats).to.be.an('array');
      expect(res.body.chats.length).to.equal(1);
      expect(res.body.chats[0].claim_id).to.equal(claim.id);
      expect(res.body.chats[0].other_party.id).to.equal(owner.id);
    });

    it('should return chats where user is item owner (200)', async function () {
      await Message.create({
        claim_id: claim.id,
        sender_id: claimant.id,
        content: 'Yes, this is mine!',
      });

      const res = await request(app)
        .get('/api/claims/my-chats')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.chats.length).to.equal(1);
      expect(res.body.chats[0].other_party.id).to.equal(claimant.id);
    });

    it('should return other_party as item owner when user is claimant', async function () {
      const res = await request(app)
        .get('/api/claims/my-chats')
        .set('Authorization', `Bearer ${claimantToken}`);

      expect(res.body.chats[0].other_party.id).to.equal(owner.id);
      expect(res.body.chats[0].other_party.name).to.equal('Item Owner');
    });

    it('should return other_party as claimant when user is item owner', async function () {
      const res = await request(app)
        .get('/api/claims/my-chats')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.body.chats[0].other_party.id).to.equal(claimant.id);
      expect(res.body.chats[0].other_party.name).to.equal('Claimant User');
    });

    it('should exclude chats the user has deleted (no new messages)', async function () {
      await Message.create({
        claim_id: claim.id,
        sender_id: owner.id,
        content: 'Old message',
      });

      await ChatDeletion.create({
        claim_id: claim.id,
        user_id: claimant.id,
        deleted_at: new Date(),
      });

      const res = await request(app)
        .get('/api/claims/my-chats')
        .set('Authorization', `Bearer ${claimantToken}`);

      expect(res.body.chats.length).to.equal(0);
    });

    it('should include a previously deleted chat if a new message arrived after deleted_at', async function () {
      const deletedAt = new Date(Date.now() - 60000);
      await ChatDeletion.create({
        claim_id: claim.id,
        user_id: claimant.id,
        deleted_at: deletedAt,
      });

      await Message.create({
        claim_id: claim.id,
        sender_id: owner.id,
        content: 'New message after deletion',
        createdAt: new Date(),
      });

      const res = await request(app)
        .get('/api/claims/my-chats')
        .set('Authorization', `Bearer ${claimantToken}`);

      expect(res.body.chats.length).to.equal(1);
    });

    it('should return last_message as null for claims with no messages', async function () {
      const res = await request(app)
        .get('/api/claims/my-chats')
        .set('Authorization', `Bearer ${claimantToken}`);

      expect(res.body.chats[0].last_message).to.be.null;
    });

    it('should not count unread messages sent before deleted_at', async function () {
      const deletedAt = new Date(Date.now() - 60000);

      await Message.create({
        claim_id: claim.id,
        sender_id: owner.id,
        content: 'Old unread message',
        createdAt: new Date(Date.now() - 120000),
      });

      await ChatDeletion.create({
        claim_id: claim.id,
        user_id: claimant.id,
        deleted_at: deletedAt,
      });

      await Message.create({
        claim_id: claim.id,
        sender_id: owner.id,
        content: 'New unread message',
        createdAt: new Date(),
      });

      const res = await request(app)
        .get('/api/claims/my-chats')
        .set('Authorization', `Bearer ${claimantToken}`);

      expect(res.body.chats[0].unread_count).to.equal(1);
    });

    it('should order by last_message.created_at DESC, nulls last', async function () {
      const item2 = await Item.create({
        user_id: owner.id,
        type: 'found',
        status: 'open',
        title: 'Found Keys',
        description: 'A set of keys',
        image_urls: [],
      });

      const claim2 = await Claim.create({
        item_id: item2.id,
        claimant_id: claimant.id,
        status: 'pending',
        proof_description: 'Those are my keys',
      });

      await Message.create({
        claim_id: claim.id,
        sender_id: owner.id,
        content: 'Older message',
        createdAt: new Date(Date.now() - 60000),
      });

      await Message.create({
        claim_id: claim2.id,
        sender_id: owner.id,
        content: 'Newer message',
        createdAt: new Date(),
      });

      const res = await request(app)
        .get('/api/claims/my-chats')
        .set('Authorization', `Bearer ${claimantToken}`);

      expect(res.body.chats[0].claim_id).to.equal(claim2.id);
      expect(res.body.chats[1].claim_id).to.equal(claim.id);
    });

    it('should return 401 without token', async function () {
      const res = await request(app).get('/api/claims/my-chats');

      expect(res.status).to.equal(401);
    });
  });

  describe('DELETE /api/claims/:id/chat', function () {
    it('should return 204 success and insert row into chat_deletions', async function () {
      const res = await request(app)
        .delete(`/api/claims/${claim.id}/chat`)
        .set('Authorization', `Bearer ${claimantToken}`);

      expect(res.status).to.equal(204);

      const deletion = await ChatDeletion.findOne({
        where: { claim_id: claim.id, user_id: claimant.id },
      });
      expect(deletion).to.not.be.null;
    });

    it('should update deleted_at when calling delete twice (ON CONFLICT DO UPDATE)', async function () {
      await request(app)
        .delete(`/api/claims/${claim.id}/chat`)
        .set('Authorization', `Bearer ${claimantToken}`);

      const firstDeletion = await ChatDeletion.findOne({
        where: { claim_id: claim.id, user_id: claimant.id },
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      await request(app)
        .delete(`/api/claims/${claim.id}/chat`)
        .set('Authorization', `Bearer ${claimantToken}`);

      const secondDeletion = await ChatDeletion.findOne({
        where: { claim_id: claim.id, user_id: claimant.id },
      });

      expect(secondDeletion!.deleted_at.getTime()).to.be.greaterThan(
        firstDeletion!.deleted_at.getTime()
      );
    });

    it('should return 403 when user is neither owner nor claimant', async function () {
      const res = await request(app)
        .delete(`/api/claims/${claim.id}/chat`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).to.equal(403);
    });

    it('should return 401 without token', async function () {
      const res = await request(app).delete(`/api/claims/${claim.id}/chat`);

      expect(res.status).to.equal(401);
    });

    it('should NOT modify messages table after deletion', async function () {
      await Message.create({
        claim_id: claim.id,
        sender_id: owner.id,
        content: 'Test message',
      });

      const messageCountBefore = await Message.count({ where: { claim_id: claim.id } });

      await request(app)
        .delete(`/api/claims/${claim.id}/chat`)
        .set('Authorization', `Bearer ${claimantToken}`);

      const messageCountAfter = await Message.count({ where: { claim_id: claim.id } });
      expect(messageCountAfter).to.equal(messageCountBefore);
    });

    it('should NOT modify claims table after deletion', async function () {
      const claimBefore = await Claim.findByPk(claim.id);

      await request(app)
        .delete(`/api/claims/${claim.id}/chat`)
        .set('Authorization', `Bearer ${claimantToken}`);

      const claimAfter = await Claim.findByPk(claim.id);
      expect(claimAfter).to.not.be.null;
      expect(claimAfter!.status).to.equal(claimBefore!.status);
    });

    it('should allow other user to still see the chat after one user deletes', async function () {
      await Message.create({
        claim_id: claim.id,
        sender_id: owner.id,
        content: 'Test message',
      });

      await request(app)
        .delete(`/api/claims/${claim.id}/chat`)
        .set('Authorization', `Bearer ${claimantToken}`);

      const ownerChats = await request(app)
        .get('/api/claims/my-chats')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(ownerChats.body.chats.length).to.equal(1);
    });
  });

  describe('GET /api/messages/:claimId (updated behaviour)', function () {
    it('should return all messages when no deletion record exists', async function () {
      await Message.create({
        claim_id: claim.id,
        sender_id: owner.id,
        content: 'Message 1',
      });
      await Message.create({
        claim_id: claim.id,
        sender_id: claimant.id,
        content: 'Message 2',
      });

      const res = await request(app)
        .get(`/api/messages/${claim.id}`)
        .set('Authorization', `Bearer ${claimantToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.messages.length).to.equal(2);
    });

    it('should return only messages after deleted_at when deletion record exists', async function () {
      const deletedAt = new Date(Date.now() - 60000);

      await Message.create({
        claim_id: claim.id,
        sender_id: owner.id,
        content: 'Old message before deletion',
        createdAt: new Date(Date.now() - 120000),
      });

      await ChatDeletion.create({
        claim_id: claim.id,
        user_id: claimant.id,
        deleted_at: deletedAt,
      });

      await Message.create({
        claim_id: claim.id,
        sender_id: owner.id,
        content: 'New message after deletion',
        createdAt: new Date(),
      });

      const res = await request(app)
        .get(`/api/messages/${claim.id}`)
        .set('Authorization', `Bearer ${claimantToken}`);

      expect(res.body.messages.length).to.equal(1);
      expect(res.body.messages[0].content).to.equal('New message after deletion');
    });
  });
});
