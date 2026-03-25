import { Op } from 'sequelize';
import { Item, User, Claim, Message, Notification } from '../models';
import notificationService from './notifications';

interface CreateClaimInput {
  item_id: string;
  proof_description: string;
  proof_images?: string[];
}

class ClaimService {
  async createClaim(claimantId: string, data: CreateClaimInput): Promise<{
    claim?: Claim;
    error?: string;
    status?: number;
  }> {
    const item = await Item.findByPk(data.item_id, {
      include: [{ model: User, as: 'owner', attributes: ['id', 'name'] }],
    });

    if (!item) {
      return { error: 'Item not found', status: 404 };
    }

    if (item.status !== 'open') {
      return { error: 'Item is not open for claims', status: 400 };
    }

    if (item.user_id === claimantId) {
      return { error: 'You cannot claim your own item', status: 403 };
    }

    const existingClaim = await Claim.findOne({
      where: {
        item_id: data.item_id,
        claimant_id: claimantId,
        status: { [Op.in]: ['pending', 'accepted'] },
      },
    });

    if (existingClaim) {
      return { error: 'You already have an active claim on this item', status: 409 };
    }

    const claimant = await User.findByPk(claimantId, {
      attributes: ['id', 'name'],
    });

    const claim = await Claim.create({
      item_id: data.item_id,
      claimant_id: claimantId,
      status: 'pending',
      proof_description: data.proof_description,
      proof_images: data.proof_images || [],
    });

    await notificationService.createNotification({
      user_id: item.user_id,
      type: 'claim_received',
      payload: {
        claim_id: claim.id,
        item_id: item.id,
        item_title: item.title,
        claimant_name: claimant?.name || 'Someone',
      },
    });

    const fullClaim = await Claim.findByPk(claim.id, {
      include: [
        { model: User, as: 'claimant', attributes: ['id', 'name', 'avatar_url', 'rating'] },
        {
          model: Item,
          as: 'item',
          attributes: ['id', 'title', 'type', 'status', 'location_name', 'image_urls'],
          include: [{ model: User, as: 'owner', attributes: ['id', 'name', 'avatar_url'] }],
        },
      ],
    });

    return { claim: fullClaim! };
  }

  async getMyClaims(userId: string): Promise<Claim[]> {
    return Claim.findAll({
      where: { claimant_id: userId },
      include: [
        {
          model: Item,
          as: 'item',
          attributes: ['id', 'title', 'type', 'status', 'location_name', 'image_urls'],
          include: [{ model: User, as: 'owner', attributes: ['id', 'name', 'avatar_url'] }],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  async getClaimsOnMyItems(userId: string): Promise<Claim[]> {
    return Claim.findAll({
      include: [
        {
          model: Item,
          as: 'item',
          attributes: ['id', 'title', 'type', 'status'],
          where: { user_id: userId },
        },
        { model: User, as: 'claimant', attributes: ['id', 'name', 'avatar_url', 'rating'] },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  async getClaimById(claimId: string, userId: string): Promise<{
    claim?: Claim;
    error?: string;
    status?: number;
  }> {
    const claim = await Claim.findByPk(claimId, {
      include: [
        { model: User, as: 'claimant', attributes: ['id', 'name', 'avatar_url', 'rating'] },
        {
          model: Item,
          as: 'item',
          attributes: ['id', 'title', 'type', 'status', 'location_name', 'image_urls', 'user_id'],
          include: [{ model: User, as: 'owner', attributes: ['id', 'name', 'avatar_url', 'phone'] }],
        },
        {
          model: Message,
          as: 'messages',
          include: [{ model: User, as: 'sender', attributes: ['id', 'name', 'avatar_url'] }],
          order: [['createdAt', 'ASC']],
        },
      ],
    });

    if (!claim) {
      return { error: 'Claim not found', status: 404 };
    }

    const item = claim.get('item') as Item;
    const isOwner = item.user_id === userId;
    const isClaimant = claim.claimant_id === userId;

    if (!isOwner && !isClaimant) {
      return { error: 'You are not authorized to view this claim', status: 403 };
    }

    return { claim };
  }

  async acceptClaim(claimId: string, userId: string): Promise<{
    claim?: Claim;
    error?: string;
    status?: number;
  }> {
    const claim = await Claim.findByPk(claimId, {
      include: [
        {
          model: Item,
          as: 'item',
          include: [{ model: User, as: 'owner', attributes: ['id'] }],
        },
      ],
    });

    if (!claim) {
      return { error: 'Claim not found', status: 404 };
    }

    const item = claim.get('item') as Item;
    if (item.user_id !== userId) {
      return { error: 'Only the item owner can accept claims', status: 403 };
    }

    if (claim.status !== 'pending') {
      return { error: 'Only pending claims can be accepted', status: 400 };
    }

    await claim.update({ status: 'accepted' });
    await item.update({ status: 'claimed' });

    const otherPendingClaims = await Claim.findAll({
      where: {
        item_id: item.id,
        id: { [Op.ne]: claimId },
        status: 'pending',
      },
    });

    for (const otherClaim of otherPendingClaims) {
      await otherClaim.update({ status: 'rejected' });
      await notificationService.createNotification({
        user_id: otherClaim.claimant_id,
        type: 'claim_rejected',
        payload: {
          claim_id: otherClaim.id,
          item_id: item.id,
          item_title: item.title,
        },
      });
    }

    await notificationService.createNotification({
      user_id: claim.claimant_id,
      type: 'claim_accepted',
      payload: {
        claim_id: claim.id,
        item_id: item.id,
        item_title: item.title,
      },
    });

    const updatedClaim = await Claim.findByPk(claimId, {
      include: [
        { model: User, as: 'claimant', attributes: ['id', 'name', 'avatar_url'] },
        {
          model: Item,
          as: 'item',
          attributes: ['id', 'title', 'type', 'status'],
          include: [{ model: User, as: 'owner', attributes: ['id', 'name', 'avatar_url'] }],
        },
      ],
    });

    return { claim: updatedClaim! };
  }

  async rejectClaim(claimId: string, userId: string): Promise<{
    claim?: Claim;
    error?: string;
    status?: number;
  }> {
    const claim = await Claim.findByPk(claimId, {
      include: [{
        model: Item,
        as: 'item',
      }],
    });

    if (!claim) {
      return { error: 'Claim not found', status: 404 };
    }

    const item = claim.get('item') as Item;
    if (item.user_id !== userId) {
      return { error: 'Only the item owner can reject claims', status: 403 };
    }

    if (claim.status !== 'pending') {
      return { error: 'Only pending claims can be rejected', status: 400 };
    }

    await claim.update({ status: 'rejected' });

    await notificationService.createNotification({
      user_id: claim.claimant_id,
      type: 'claim_rejected',
      payload: {
        claim_id: claim.id,
        item_id: item.id,
        item_title: item.title,
      },
    });

    const updatedClaim = await Claim.findByPk(claimId, {
      include: [
        { model: User, as: 'claimant', attributes: ['id', 'name', 'avatar_url'] },
        {
          model: Item,
          as: 'item',
          attributes: ['id', 'title', 'type', 'status'],
          include: [{ model: User, as: 'owner', attributes: ['id', 'name', 'avatar_url'] }],
        },
      ],
    });

    return { claim: updatedClaim! };
  }

  async resolveClaim(claimId: string, userId: string): Promise<{
    claim?: Claim;
    error?: string;
    status?: number;
  }> {
    const claim = await Claim.findByPk(claimId, {
      include: [{
        model: Item,
        as: 'item',
      }],
    });

    if (!claim) {
      return { error: 'Claim not found', status: 404 };
    }

    const item = claim.get('item') as Item;
    const isOwner = item.user_id === userId;
    const isClaimant = claim.claimant_id === userId;

    if (!isOwner && !isClaimant) {
      return { error: 'Only the item owner or claimant can resolve claims', status: 403 };
    }

    if (claim.status !== 'accepted') {
      return { error: 'Only accepted claims can be resolved', status: 400 };
    }

    await claim.update({ status: 'resolved', resolved_at: new Date() });
    await item.update({ status: 'resolved' });

    const otherPartyId = isOwner ? claim.claimant_id : item.user_id;
    await notificationService.createNotification({
      user_id: otherPartyId,
      type: 'item_resolved',
      payload: {
        claim_id: claim.id,
        item_id: item.id,
        item_title: item.title,
      },
    });

    const updatedClaim = await Claim.findByPk(claimId, {
      include: [
        { model: User, as: 'claimant', attributes: ['id', 'name', 'avatar_url'] },
        {
          model: Item,
          as: 'item',
          attributes: ['id', 'title', 'type', 'status'],
          include: [{ model: User, as: 'owner', attributes: ['id', 'name', 'avatar_url'] }],
        },
      ],
    });

    return { claim: updatedClaim! };
  }
}

export default new ClaimService();
