import { Op } from 'sequelize';
import { Message, Claim, Item, User, ChatDeletion, Address } from '../models';
import notificationService from './notifications';
import { getIO } from '../socket';

class MessageService {
  async getMessages(claimId: string, userId: string): Promise<{
    messages?: Message[];
    claim?: Record<string, unknown>;
    contact?: { phone: string | null; address: string | null } | null;
    error?: string;
    status?: number;
  }> {
    const claim = await Claim.findByPk(claimId, {
      include: [
        {
          model: User,
          as: 'claimant',
          attributes: ['id', 'name', 'avatar_url', 'phone', 'rating'],
          include: [{ model: Address, as: 'address' }],
        },
        {
          model: Item,
          as: 'item',
          attributes: ['id', 'title', 'type', 'status', 'location_name', 'image_urls', 'user_id'],
          include: [{
            model: User,
            as: 'owner',
            attributes: ['id', 'name', 'avatar_url', 'phone', 'rating'],
            include: [{ model: Address, as: 'address' }],
          }],
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
      return { error: 'You are not authorized to view these messages', status: 403 };
    }

    const chatDeletion = await ChatDeletion.findOne({
      where: { claim_id: claimId, user_id: userId },
    });

    const messageWhereClause: Record<string, unknown> = { claim_id: claimId };
    if (chatDeletion) {
      messageWhereClause.createdAt = { [Op.gt]: chatDeletion.deleted_at };
    }

    await Message.update(
      { read_at: new Date() },
      {
        where: {
          claim_id: claimId,
          sender_id: { [Op.ne]: userId },
          read_at: { [Op.eq]: null },
          ...(chatDeletion ? { createdAt: { [Op.gt]: chatDeletion.deleted_at } } : {}),
        },
      }
    );

    const messages = await Message.findAll({
      where: messageWhereClause,
      include: [{ model: User, as: 'sender', attributes: ['id', 'name', 'avatar_url'] }],
      order: [['createdAt', 'ASC']],
    });

    const owner = (item as Item & { owner?: User & { address?: Address } }).owner;
    const claimant = claim.get('claimant') as User & { address?: Address };
    const claimData = {
      id: claim.id,
      status: claim.status,
      item: {
        id: item.id,
        title: item.title,
        type: item.type,
        status: item.status,
        location_name: item.location_name,
        image_urls: item.image_urls,
      },
      claimant: claimant ? {
        id: claimant.id,
        name: claimant.name,
        avatar_url: claimant.avatar_url,
        rating: claimant.rating,
      } : null,
      owner: owner ? {
        id: owner.id,
        name: owner.name,
        avatar_url: owner.avatar_url,
        rating: owner.rating,
      } : null,
    };

    let contact: { phone: string | null; address: string | null } | null = null;
    if (claim.status === 'accepted') {
      if (isOwner) {
        contact = {
          phone: claimant?.phone ?? null,
          address: claimant?.address?.address_line1 ?? null,
        };
      } else {
        contact = {
          phone: owner?.phone ?? null,
          address: owner?.address?.address_line1 ?? null,
        };
      }
    }

    return { messages, claim: claimData, contact };
  }

  async sendMessage(claimId: string, senderId: string, content: string): Promise<{
    message?: Message;
    error?: string;
    status?: number;
  }> {
    const claim = await Claim.findByPk(claimId, {
      include: [{
        model: Item,
        as: 'item',
        attributes: ['id', 'title', 'user_id'],
      }],
    });

    if (!claim) {
      return { error: 'Claim not found', status: 404 };
    }

    const item = claim.get('item') as Item;
    const isOwner = item.user_id === senderId;
    const isClaimant = claim.claimant_id === senderId;

    if (!isOwner && !isClaimant) {
      return { error: 'You are not authorized to send messages on this claim', status: 403 };
    }

    if (claim.status === 'rejected' || claim.status === 'resolved') {
      return { error: 'Cannot send messages on a closed claim', status: 403 };
    }

    const message = await Message.create({
      claim_id: claimId,
      sender_id: senderId,
      content,
    });

    const sender = await User.findByPk(senderId, { attributes: ['id', 'name'] });
    const recipientId = isOwner ? claim.claimant_id : item.user_id;

    await notificationService.createNotification({
      user_id: recipientId,
      type: 'new_message',
      payload: {
        claim_id: claimId,
        item_id: item.id,
        sender_name: sender?.name || 'Someone',
        preview: content.slice(0, 60),
      },
    });

    const fullMessage = await Message.findByPk(message.id, {
      include: [{ model: User, as: 'sender', attributes: ['id', 'name', 'avatar_url'] }],
    });

    await ChatDeletion.destroy({
      where: { claim_id: claimId },
    });

    const ownerId = item.user_id;
    const claimantId = claim.claimant_id;

    try {
      const io = getIO();
      const senderData = fullMessage?.get('sender') as User | undefined;
      const messagePayload = {
        id: fullMessage!.id,
        claim_id: fullMessage!.claim_id,
        sender_id: fullMessage!.sender_id,
        content: fullMessage!.content,
        read_at: fullMessage!.read_at,
        created_at: fullMessage!.createdAt,
        sender: senderData
          ? {
              id: senderData.id,
              name: senderData.name,
              avatar_url: senderData.avatar_url,
            }
          : null,
      };
      console.log(`[socket] Emitting new_message to claim:${claimId}`, messagePayload.id);
      io.to(`claim:${claimId}`).emit('new_message', messagePayload);

      const chatListUpdatePayload = {
        claim_id: claimId,
        last_message: {
          id: fullMessage!.id,
          content: fullMessage!.content,
          sender_id: fullMessage!.sender_id,
          created_at: fullMessage!.createdAt,
        },
      };
      io.to(`user:${ownerId}`).emit('chat_list_updated', chatListUpdatePayload);
      io.to(`user:${claimantId}`).emit('chat_list_updated', chatListUpdatePayload);
    } catch (error) {
      console.warn('[socket] Socket.io not initialized, skipping message emit', error);
    }

    return { message: fullMessage! };
  }

  async markMessagesRead(claimId: string, userId: string): Promise<number> {
    const [updated] = await Message.update(
      { read_at: new Date() },
      {
        where: {
          claim_id: claimId,
          sender_id: { [Op.ne]: userId },
          read_at: { [Op.eq]: null },
        },
      }
    );
    return updated;
  }
}

export default new MessageService();
