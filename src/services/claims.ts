import { Op, QueryTypes } from 'sequelize';
import { Item, User, Claim, Message, Notification, sequelize, ChatDeletion } from '../models';
import notificationService from './notifications';
import { getIO } from '../socket';

export interface ChatSummary {
  claim_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'resolved';
  item: {
    id: string;
    title: string;
    type: 'lost' | 'found';
    status: string;
    thumbnail_url: string | null;
    location_name: string;
  };
  other_party: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  last_message: {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
  } | null;
  unread_count: number;
}

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

    try {
      const io = getIO();
      const claimUpdatePayload = {
        claim_id: claimId,
        status: 'accepted',
        item_id: item.id,
      };
      io.to(`claim:${claimId}`).emit('claim_updated', claimUpdatePayload);
      io.to(`user:${item.user_id}`).emit('claim_updated', claimUpdatePayload);
      io.to(`user:${claim.claimant_id}`).emit('claim_updated', claimUpdatePayload);
    } catch {
      console.warn('[socket] Socket.io not initialized, skipping claim_updated emit');
    }

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

    try {
      const io = getIO();
      const claimUpdatePayload = {
        claim_id: claimId,
        status: 'rejected',
        item_id: item.id,
      };
      io.to(`claim:${claimId}`).emit('claim_updated', claimUpdatePayload);
      io.to(`user:${item.user_id}`).emit('claim_updated', claimUpdatePayload);
      io.to(`user:${claim.claimant_id}`).emit('claim_updated', claimUpdatePayload);
    } catch {
      console.warn('[socket] Socket.io not initialized, skipping claim_updated emit');
    }

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

    try {
      const io = getIO();
      const claimUpdatePayload = {
        claim_id: claimId,
        status: 'resolved',
        item_id: item.id,
      };
      io.to(`claim:${claimId}`).emit('claim_updated', claimUpdatePayload);
      io.to(`user:${item.user_id}`).emit('claim_updated', claimUpdatePayload);
      io.to(`user:${claim.claimant_id}`).emit('claim_updated', claimUpdatePayload);
    } catch {
      console.warn('[socket] Socket.io not initialized, skipping claim_updated emit');
    }

    return { claim: updatedClaim! };
  }

  async getMyChats(userId: string): Promise<ChatSummary[]> {
    const query = `
      WITH user_claims AS (
        SELECT c.id as claim_id, c.status, c.claimant_id,
               i.id as item_id, i.title as item_title, i.type as item_type, 
               i.status as item_status, i.image_urls, i.location_name, i.user_id as owner_id,
               owner.id as owner_user_id, owner.name as owner_name, owner.avatar_url as owner_avatar,
               claimant.id as claimant_user_id, claimant.name as claimant_name, claimant.avatar_url as claimant_avatar
        FROM claims c
        INNER JOIN items i ON i.id = c.item_id
        INNER JOIN users owner ON owner.id = i.user_id
        INNER JOIN users claimant ON claimant.id = c.claimant_id
        WHERE c.claimant_id = :userId OR i.user_id = :userId
      ),
      last_messages AS (
        SELECT DISTINCT ON (m.claim_id)
               m.claim_id, m.id as message_id, m.content, m.sender_id, m.created_at
        FROM messages m
        ORDER BY m.claim_id, m.created_at DESC
      ),
      unread_counts AS (
        SELECT m.claim_id,
               COUNT(*) FILTER (
                 WHERE m.sender_id != :userId 
                 AND m.read_at IS NULL
                 AND m.created_at > COALESCE(
                   (SELECT cd.deleted_at FROM chat_deletions cd 
                    WHERE cd.claim_id = m.claim_id AND cd.user_id = :userId),
                   '1970-01-01'::timestamp
                 )
               ) as unread_count
        FROM messages m
        GROUP BY m.claim_id
      )
      SELECT 
        uc.claim_id,
        uc.status,
        uc.item_id,
        uc.item_title,
        uc.item_type,
        uc.item_status,
        uc.image_urls,
        uc.location_name,
        CASE 
          WHEN uc.claimant_id = :userId THEN uc.owner_user_id
          ELSE uc.claimant_user_id
        END as other_party_id,
        CASE 
          WHEN uc.claimant_id = :userId THEN uc.owner_name
          ELSE uc.claimant_name
        END as other_party_name,
        CASE 
          WHEN uc.claimant_id = :userId THEN uc.owner_avatar
          ELSE uc.claimant_avatar
        END as other_party_avatar,
        lm.message_id,
        lm.content as last_message_content,
        lm.sender_id as last_message_sender_id,
        lm.created_at as last_message_created_at,
        COALESCE(urc.unread_count, 0) as unread_count
      FROM user_claims uc
      LEFT JOIN last_messages lm ON lm.claim_id = uc.claim_id
      LEFT JOIN unread_counts urc ON urc.claim_id = uc.claim_id
      WHERE NOT EXISTS (
        SELECT 1 FROM chat_deletions cd
        WHERE cd.claim_id = uc.claim_id
        AND cd.user_id = :userId
        AND (
          lm.created_at IS NULL 
          OR lm.created_at <= cd.deleted_at
        )
      )
      ORDER BY lm.created_at DESC NULLS LAST
    `;

    const rows = await sequelize.query(query, {
      replacements: { userId },
      type: QueryTypes.SELECT,
    }) as Array<{
      claim_id: string;
      status: 'pending' | 'accepted' | 'rejected' | 'resolved';
      item_id: string;
      item_title: string;
      item_type: 'lost' | 'found';
      item_status: string;
      image_urls: string[] | null;
      location_name: string;
      other_party_id: string;
      other_party_name: string;
      other_party_avatar: string | null;
      message_id: string | null;
      last_message_content: string | null;
      last_message_sender_id: string | null;
      last_message_created_at: string | null;
      unread_count: string;
    }>;

    return rows.map((row) => ({
      claim_id: row.claim_id,
      status: row.status,
      item: {
        id: row.item_id,
        title: row.item_title,
        type: row.item_type,
        status: row.item_status,
        thumbnail_url: row.image_urls?.[0] || null,
        location_name: row.location_name,
      },
      other_party: {
        id: row.other_party_id,
        name: row.other_party_name,
        avatar_url: row.other_party_avatar,
      },
      last_message: row.message_id
        ? {
            id: row.message_id,
            content: row.last_message_content!,
            sender_id: row.last_message_sender_id!,
            created_at: row.last_message_created_at!,
          }
        : null,
      unread_count: parseInt(row.unread_count, 10),
    }));
  }

  async deleteChat(claimId: string, userId: string): Promise<{
    error?: string;
    status?: number;
  }> {
    const claim = await Claim.findByPk(claimId, {
      include: [
        {
          model: Item,
          as: 'item',
          attributes: ['user_id'],
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
      return { error: 'You are not authorized to delete this chat', status: 403 };
    }

    await sequelize.query(
      `INSERT INTO chat_deletions (claim_id, user_id, deleted_at)
       VALUES (:claimId, :userId, NOW())
       ON CONFLICT (claim_id, user_id) DO UPDATE SET deleted_at = NOW()`,
      {
        replacements: { claimId, userId },
        type: QueryTypes.INSERT,
      }
    );

    try {
      const io = getIO();
      io.to(`user:${userId}`).emit('chat_deleted', { claim_id: claimId });
    } catch {
      console.warn('[socket] Socket.io not initialized, skipping chat_deleted emit');
    }

    return {};
  }
}

export default new ClaimService();
