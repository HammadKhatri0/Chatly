import { format, isThisWeek, isToday, isYesterday } from 'date-fns';
import { API_URL } from '../api/client.js';

/** Turns a stored "/uploads/x.png" path into an absolute URL. */
export const assetUrl = (path) => {
  if (!path) return '';
  return /^https?:\/\//.test(path) ? path : `${API_URL}${path}`;
};

export const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || '')
    .join('')
    .toUpperCase();

export const timeOnly = (date) => (date ? format(new Date(date), 'HH:mm') : '');

/** Compact stamp used in the inbox list. */
export const relativeStamp = (date) => {
  if (!date) return '';
  const value = new Date(date);
  if (isToday(value)) return format(value, 'HH:mm');
  if (isYesterday(value)) return 'Yesterday';
  if (isThisWeek(value)) return format(value, 'EEE');
  return format(value, 'dd MMM');
};

export const fullStamp = (date) => (date ? format(new Date(date), 'dd MMM yyyy, HH:mm') : '');

export const dayLabel = (date) => {
  const value = new Date(date);
  if (isToday(value)) return 'Today';
  if (isYesterday(value)) return 'Yesterday';
  return format(value, 'dd MMMM yyyy');
};

export const fileSize = (bytes = 0) => {
  if (!bytes) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
};

export const duration = (seconds = 0) => {
  const total = Math.round(seconds);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

/** The person on the other side of a direct chat. */
export const otherMember = (conversation, currentUserId) =>
  conversation?.members?.find((member) => String(member._id) !== String(currentUserId)) || null;

export const conversationTitle = (conversation, currentUserId) => {
  if (!conversation) return '';
  if (conversation.isGroup) return conversation.name || 'Group chat';

  // An admin viewing a chat they are not part of should see both participants.
  const participant = conversation.members?.some((m) => String(m._id) === String(currentUserId));
  if (!participant) return conversation.members?.map((m) => m.name).join(' ↔ ') || 'Direct chat';

  return otherMember(conversation, currentUserId)?.name || 'Unknown user';
};

export const conversationAvatar = (conversation, currentUserId) => {
  if (!conversation) return '';
  return conversation.isGroup
    ? conversation.avatar
    : otherMember(conversation, currentUserId)?.avatar || '';
};

export const messagePreview = (message) => {
  if (!message) return 'No messages yet';
  if (message.type === 'image') return '📷 Photo';
  if (message.type === 'audio') return '🎤 Voice message';
  if (message.type === 'file') return `📎 ${message.attachment?.name || 'File'}`;
  return message.text || '';
};
