import { Op } from 'sequelize';
import { Message, Claim, Item, User } from '../models';
import notificationService from './notifications';
import { getIO } from '../socket';

class MessageService {
  async getMessages(claimId: string, userId: string): Promise<{
    messages?: Message[];
    claim?: Record<string, unknown>;
    contact?: { whatsapp_url: string };
    error?: string;
    status?: number;
  }> {
    const claim = await Claim.findByPk(claimId, {
      include: [
        { model: User, as: 'claimant', attributes: ['id', 'name', 'avatar_url'] },
        {
          model: Item,
          as: 'item',
          attributes: ['id', 'title', 'type', 'status', 'location_name', 'image_urls', 'user_id'],
          include: [{ model: User, as: 'owner', attributes: ['id', 'name', 'avatar_url', 'phone'] }],
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

    await Message.update(
      { read_at: new Date() },
      {
        where: {
          claim_id: claimId,
          sender_id: { [Op.ne]: userId },
          read_at: { [Op.eq]: null },
        },
      }
    );

    const messages = await Message.findAll({
      where: { claim_id: claimId },
      include: [{ model: User, as: 'sender', attributes: ['id', 'name', 'avatar_url'] }],
      order: [['createdAt', 'ASC']],
    });

    const owner = (item as Item & { owner?: User }).owner;
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
      claimant: claim.get('claimant'),
      owner: owner ? { id: owner.id, name: owner.name, avatar_url: owner.avatar_url } : null,
    };

    let contact: { whatsapp_url: string } | undefined;
    if (claim.status === 'accepted' && owner?.phone) {
      const message = `Hi, I found your item "${item.title}" on Sigide`;
      contact = {
        whatsapp_url: `https://wa.me/91${owner.phone}?text=${encodeURIComponent(message)}`,
      };
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
