import mongoose from 'mongoose';
import Message from '../models/Message.js';

export const MEMBER_FIELDS = 'name email avatar isOnline lastSeen role';

export const populateConversation = (query) =>
  query
    .populate('members', MEMBER_FIELDS)
    .populate('admins', MEMBER_FIELDS)
    .populate({ path: 'lastMessage', populate: { path: 'sender', select: 'name avatar' } });

/** Counts, per conversation, the messages the user has not read yet. */
export const getUnreadCounts = async (conversationIds, userId) => {
  if (!conversationIds.length) return {};
  const rows = await Message.aggregate([
    {
      $match: {
        conversation: { $in: conversationIds.map((id) => new mongoose.Types.ObjectId(String(id))) },
        sender: { $ne: new mongoose.Types.ObjectId(String(userId)) },
        readBy: { $ne: new mongoose.Types.ObjectId(String(userId)) },
      },
    },
    { $group: { _id: '$conversation', count: { $sum: 1 } } },
  ]);
  return Object.fromEntries(rows.map((row) => [String(row._id), row.count]));
};

export const withUnread = async (conversations, userId) => {
  const counts = await getUnreadCounts(
    conversations.map((c) => c._id),
    userId
  );
  return conversations.map((conversation) => {
    const plain = typeof conversation.toObject === 'function' ? conversation.toObject() : conversation;
    return { ...plain, unreadCount: counts[String(plain._id)] || 0 };
  });
};

export const isMember = (conversation, userId) =>
  conversation.members.some((m) => String(m._id || m) === String(userId));
