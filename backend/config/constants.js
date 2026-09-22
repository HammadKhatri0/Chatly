export const ROLES = Object.freeze({ ADMIN: 'admin', USER: 'user' });

export const MESSAGE_TYPES = Object.freeze({
  TEXT: 'text',
  IMAGE: 'image',
  AUDIO: 'audio',
  FILE: 'file',
});

export const REQUEST_STATUS = Object.freeze({
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
});

/** Conversations beyond this count (ordered by recency) belong to the archive inbox. */
export const INBOX_LIMIT = 10;

export const SOCKET_EVENTS = Object.freeze({
  MESSAGE_NEW: 'message:new',
  MESSAGE_READ: 'message:read',
  CONVERSATION_UPDATED: 'conversation:updated',
  CONVERSATION_NEW: 'conversation:new',
  TYPING: 'typing',
  PRESENCE: 'presence',
  FRIEND_REQUEST: 'friend:request',
  FRIEND_UPDATE: 'friend:update',
});
