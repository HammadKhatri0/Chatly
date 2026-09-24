import { Server } from 'socket.io';
import { env } from '../config/env.js';
import { SOCKET_EVENTS } from '../config/constants.js';
import { verifyToken } from '../utils/token.js';
import User from '../models/User.js';
import { setIO, userRoom, emitToUsers } from './registry.js';

const onlineUsers = new Map(); // userId -> socket count

const setPresence = async (userId, isOnline) => {
  await User.findByIdAndUpdate(userId, { isOnline, lastSeen: new Date() }).catch(() => null);
  const user = await User.findById(userId).select('friends').lean().catch(() => null);
  emitToUsers(user?.friends || [], SOCKET_EVENTS.PRESENCE, { userId, isOnline });
};

export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: env.clientUrls, credentials: true },
    maxHttpBufferSize: 1e6,
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication token missing'));
      const payload = verifyToken(token);
      socket.userId = payload.id;
      socket.role = payload.role;
      return next();
    } catch {
      return next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const { userId } = socket;
    socket.join(userRoom(userId));

    // Listeners are bound synchronously: awaiting anything first would silently
    // drop events a client sends in the meantime.
    socket.on(SOCKET_EVENTS.TYPING, ({ conversationId, members = [], isTyping }) => {
      emitToUsers(
        members.filter((id) => String(id) !== String(userId)),
        SOCKET_EVENTS.TYPING,
        { conversationId, userId, isTyping }
      );
    });

    socket.on('disconnect', () => {
      const left = (onlineUsers.get(userId) || 1) - 1;
      if (left <= 0) {
        onlineUsers.delete(userId);
        setPresence(userId, false);
      } else {
        onlineUsers.set(userId, left);
      }
    });

    const count = (onlineUsers.get(userId) || 0) + 1;
    onlineUsers.set(userId, count);
    if (count === 1) setPresence(userId, true);
  });

  setIO(io);
  return io;
};
