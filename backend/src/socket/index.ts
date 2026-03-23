import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { getRedisClient } from '../db/redis';
import { logger } from '../middleware/requestLogger';
import jwt from 'jsonwebtoken';

export let io: SocketServer;

interface SocketAuthUser {
  _id: string;
  role: string;
}

export function initSocket(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: (process.env.CORS_ORIGINS ?? 'http://localhost:5173').split(',').map(o => o.trim()),
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Redis pub/sub adapter for horizontal scaling
  const pubClient = getRedisClient().duplicate();
  const subClient = getRedisClient().duplicate();
  io.adapter(createAdapter(pubClient, subClient));

  // JWT auth middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return next(new Error('Server configuration error'));
    }

    try {
      const payload = jwt.verify(token, jwtSecret) as SocketAuthUser;
      socket.data.user = payload;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user as SocketAuthUser;
    logger.info(`Socket connected: ${user._id} (${user.role})`);

    // Join user-specific room
    void socket.join(`user:${user._id}`);

    // Join role-specific room
    void socket.join(`role:${user.role}`);

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${user._id} — ${reason}`);
    });
  });

  logger.info('Socket.io initialized');
  return io;
}

// Helper: emit to a specific user
export function emitToUser(userId: string, event: string, data: unknown): void {
  io?.to(`user:${userId}`).emit(event, data);
}

// Helper: emit to all users with a role
export function emitToRole(role: string, event: string, data: unknown): void {
  io?.to(`role:${role}`).emit(event, data);
}
