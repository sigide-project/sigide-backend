import { expect } from 'chai';
import request from 'supertest';
import app from '../../src/index';
import { User, Item, Claim, Message, Notification } from '../../src/models';
import { generateToken } from '../../src/middlewares/auth';

describe('Messages API', function () {
  this.timeout(15000);

  let owner: User;
  let finder: User;
  let unrelatedUser: User;
  let ownerToken: string;
  let finderToken: string;
  let unrelatedToken: string;
  let item: Item;
  let pendingClaim: Claim;
  let acceptedClaim: Claim;
  let rejectedClaim: Claim;

  beforeEach(async function () {
    await Notification.destroy({ where: {}, force: true });
    await Message.destroy({ where: {}, force: true });
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

    unrelatedUser = await User.create({
      name: 'Unrelated User',
      email: 'unrelated@test.com',
      password_hash: hash,
      rating: 0,
      role: 'user',
    });

    ownerToken = generateToken({ id: owner.id, email: owner.email });
    finderToken = generateToken({ id: finder.id, email: finder.email });
    unrelatedToken = generateToken({ id: unrelatedUser.id, email: unrelatedUser.email });

    item = await Item.create({
      user_id: owner.id,
      type: 'lost',
      status: 'open',
      title: 'Lost Wallet',
      description: 'A brown leather wallet',
      image_urls: [],
    });

    pendingClaim = await Claim.create({
      item_id: item.id,
      claimant_id: finder.id,
      status: 'pending',
      proof_description: 'Found it near the park',
      proof_images: [],
    });

    acceptedClaim = await Claim.create({
      item_id: item.id,
      claimant_id: finder.id,
      status: 'accepted',
      proof_description: 'Found it near the park - accepted',
      proof_images: [],
    });

    rejectedClaim = await Claim.create({
      item_id: item.id,
      claimant_id: finder.id,
      status: 'rejected',
      proof_description: 'Found it near the park - rejected',
      proof_images: [],
    });

    await Message.create({
      claim_id: pendingClaim.id,
      sender_id: finder.id,
      content: 'Hello, I found your wallet',
    });

    await Message.create({
      claim_id: pendingClaim.id,
      sender_id: owner.id,
      content: 'Great! Where did you find it?',
    });
  });

  describe('GET /api/messages/:claimId', function () {
    it('should return messages in ASC order', async function () {
      const res = await request(app)
        .get(`/api/messages/${pendingClaim.id}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.messages).to.be.an('array');
      expect(res.body.messages).to.have.length(2);
      expect(res.body.messages[0].content).to.equal('Hello, I found your wallet');
      expect(res.body.messages[1].content).to.equal('Great! Where did you find it?');
    });

    it('should mark unread messages as read', async function () {
      const res = await request(app)
        .get(`/api/messages/${pendingClaim.id}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).to.equal(200);

      const finderMessage = await Message.findOne({
        where: { claim_id: pendingClaim.id, sender_id: finder.id },
      });
      expect(finderMessage!.read_at).to.not.be.null;
    });

    it('should include contact.whatsapp_url only when claim is accepted', async function () {
      const pendingRes = await request(app)
        .get(`/api/messages/${pendingClaim.id}`)
        .set('Authorization', `Bearer ${finderToken}`);

      expect(pendingRes.body.contact).to.be.undefined;

      const acceptedRes = await request(app)
        .get(`/api/messages/${acceptedClaim.id}`)
        .set('Authorization', `Bearer ${finderToken}`);

      expect(acceptedRes.body.contact).to.have.property('whatsapp_url');
      expect(acceptedRes.body.contact.whatsapp_url).to.include('wa.me');
    });

    it('should return 403 for unrelated user', async function () {
      const res = await request(app)
        .get(`/api/messages/${pendingClaim.id}`)
        .set('Authorization', `Bearer ${unrelatedToken}`);

      expect(res.status).to.equal(403);
    });
  });

  describe('POST /api/messages/:claimId', function () {
    it('should send a message successfully (201)', async function () {
      const res = await request(app)
        .post(`/api/messages/${pendingClaim.id}`)
        .set('Authorization', `Bearer ${finderToken}`)
        .send({ content: 'I have the wallet with me' });

      expect(res.status).to.equal(201);
      expect(res.body.message).to.have.property('id');
      expect(res.body.message.content).to.equal('I have the wallet with me');
    });

    it('should return 403 on rejected claim', async function () {
      const res = await request(app)
        .post(`/api/messages/${rejectedClaim.id}`)
        .set('Authorization', `Bearer ${finderToken}`)
        .send({ content: 'Trying to message on rejected claim' });

      expect(res.status).to.equal(403);
    });

    it('should return 403 on resolved claim', async function () {
      const resolvedClaim = await Claim.create({
        item_id: item.id,
        claimant_id: finder.id,
        status: 'resolved',
        proof_description: 'Resolved claim',
        proof_images: [],
        resolved_at: new Date(),
      });

      const res = await request(app)
        .post(`/api/messages/${resolvedClaim.id}`)
        .set('Authorization', `Bearer ${finderToken}`)
        .send({ content: 'Trying to message on resolved claim' });

      expect(res.status).to.equal(403);
    });
  });
});
