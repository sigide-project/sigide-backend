import http from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { Claim, Item } from '../models';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

interface JwtPayload {
  id: string;
  email: string;
}

interface SocketUser {
  id: string;
  email: string;
}

interface ServerToClientEvents {
  error: (data: { message: string }) => void;
  new_message: (data: Record<string, unknown>) => void;
  new_notification: (data: Record<string, unknown>) => void;
  claim_updated: (data: Record<string, unknown>) => void;
  chat_deleted: (data: { claim_id: string }) => void;
  chat_list_updated: (data: {
    claim_id: string;
    last_message: {
      id: string;
      content: string;
      sender_id: string;
      created_at: Date;
    };
  }) => void;
}

interface ClientToServerEvents {
  join_claim: (payload: { claimId: string }) => void;
  leave_claim: (payload: { claimId: string }) => void;
}

interface SocketData {
  user: SocketUser;
}

type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

let io: Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData> | null = null;

export function initSocket(server: http.Server): void {
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5173',
  ];

  io = new Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use(socketAuthMiddleware);

  io.on('connection', (socket: AppSocket) => {
    const userId = socket.data.user.id;
    console.log(`[socket] connected: ${userId}`);

    socket.join(`user:${userId}`);

    socket.on('join_claim', async (payload: { claimId: string }) => {
      await handleJoinClaim(socket, payload);
    });

    socket.on('leave_claim', (payload: { claimId: string }) => {
      handleLeaveClaim(socket, payload);
    });

    socket.on('disconnect', (reason: string) => {
      console.log(`[socket] disconnected: ${userId} (${reason})`);
    });
  });

  console.log('[socket] Socket.io initialized');
}

export function getIO(): Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData> {
  if (!io) {
    throw new Error('Socket.io has not been initialized. Call initSocket first.');
  }
  return io;
}

export function socketAuthMiddleware(
  socket: AppSocket,
  next: (err?: Error) => void
): void {
  const token = socket.handshake.auth.token as string | undefined;

  if (!token) {
    return next(new Error('Unauthorized'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    socket.data = {
      user: {
        id: decoded.id,
        email: decoded.email,
      },
    };
    next();
  } catch {
    next(new Error('Unauthorized'));
  }
}

async function handleJoinClaim(
  socket: AppSocket,
  payload: { claimId: string }
): Promise<void> {
  const { claimId } = payload;
  const userId = socket.data.user.id;

  try {
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
      socket.emit('error', { message: 'Claim not found' });
      return;
    }

    const item = claim.get('item') as Item;
    const isOwner = item.user_id === userId;
    const isClaimant = claim.claimant_id === userId;

    if (!isOwner && !isClaimant) {
      socket.emit('error', { message: 'You are not authorized to join this claim room' });
      return;
    }

    socket.join(`claim:${claimId}`);
    console.log(`[socket] user ${userId} joined claim:${claimId}`);
  } catch (error) {
    console.error('[socket] Error joining claim room:', error);
    socket.emit('error', { message: 'Failed to join claim room' });
  }
}

function handleLeaveClaim(socket: AppSocket, payload: { claimId: string }): void {
  const { claimId } = payload;
  const userId = socket.data.user.id;

  socket.leave(`claim:${claimId}`);
  console.log(`[socket] user ${userId} left claim:${claimId}`);
}
