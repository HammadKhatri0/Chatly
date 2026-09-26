import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { escapeRegex } from '../utils/pagination.js';
import { storeFile, removeFile } from '../middleware/upload.js';
import { INBOX_LIMIT, SOCKET_EVENTS } from '../config/constants.js';
import { emitToUsers } from '../sockets/registry.js';
import { isAdmin } from '../middleware/auth.js';
import { populateConversation, withUnread, isMember, MEMBER_FIELDS } from '../utils/conversationHelpers.js';

const loadConversation = async (id, user, { mustBeMember = true } = {}) => {
  if (!mongoose.isValidObjectId(id)) throw ApiError.badRequest('Invalid conversation id');
  const conversation = await populateConversation(Conversation.findById(id));
  if (!conversation) throw ApiError.notFound('Conversation not found');
  if (mustBeMember && !isMember(conversation, user._id) && !isAdmin(user)) {
    throw ApiError.forbidden('You are not part of this conversation');
  }
  return conversation;
};

/**
 * Inbox listing. scope=recent returns the 10 newest chats, scope=archive the rest,
 * and a search term looks across every chat the user belongs to.
 */
export const listConversations = asyncHandler(async (req, res) => {
  const { scope = 'recent', q = '' } = req.query;
  const term = escapeRegex(String(q).trim());

  let conversations = await populateConversation(
    Conversation.find({ members: req.user._id }).sort({ lastMessageAt: -1 })
  );

  if (term) {
    const regex = new RegExp(term, 'i');
    conversations = conversations.filter((conversation) => {
      if (conversation.isGroup) return regex.test(conversation.name || '');
      return conversation.members.some(
        (member) =>
          String(member._id) !== String(req.user._id) &&
          (regex.test(member.name) || regex.test(member.email))
      );
    });
  } else if (scope === 'recent') {
    conversations = conversations.slice(0, INBOX_LIMIT);
  } else if (scope === 'archive') {
    conversations = conversations.slice(INBOX_LIMIT);
  }

  res.json({ success: true, conversations: await withUnread(conversations, req.user._id) });
});

export const getConversation = asyncHandler(async (req, res) => {
  const conversation = await loadConversation(req.params.id, req.user);
  const [decorated] = await withUnread([conversation], req.user._id);
  res.json({ success: true, conversation: decorated });
});

/** Opens (or creates) the one-to-one chat with another user — friendship is not required. */
export const openDirectConversation = asyncHandler(async (req, res) => {
  const targetId = req.body.userId;
  if (!mongoose.isValidObjectId(targetId)) throw ApiError.badRequest('Invalid user id');
  if (String(targetId) === String(req.user._id)) throw ApiError.badRequest('You cannot chat with yourself');

  const target = await User.findById(targetId);
  if (!target) throw ApiError.notFound('User not found');

  const pairKey = Conversation.buildPairKey(req.user._id, targetId);
  let conversation = await Conversation.findOne({ pairKey });
  let created = false;

  if (!conversation) {
    conversation = await Conversation.create({
      isGroup: false,
      members: [req.user._id, targetId],
      createdBy: req.user._id,
      pairKey,
      lastMessageAt: new Date(),
    });
    created = true;
  }

  const populated = await populateConversation(Conversation.findById(conversation._id));
  const [decorated] = await withUnread([populated], req.user._id);

  if (created) {
    emitToUsers([targetId], SOCKET_EVENTS.CONVERSATION_NEW, { conversation: decorated });
  }
  res.status(created ? 201 : 200).json({ success: true, conversation: decorated });
});

export const createGroup = asyncHandler(async (req, res) => {
  const { name, memberIds = [] } = req.body;
  if (!name || !String(name).trim()) throw ApiError.badRequest('Group name is required');

  // Multipart requests carry memberIds as a JSON string, JSON requests as an array.
  let parsed = memberIds;
  if (typeof memberIds === 'string') {
    try {
      parsed = JSON.parse(memberIds);
    } catch {
      throw ApiError.badRequest('memberIds must be a list of user ids');
    }
  }

  const ids = (Array.isArray(parsed) ? parsed : [])
    .map(String)
    .filter((id) => mongoose.isValidObjectId(id) && id !== String(req.user._id));
  if (!ids.length) throw ApiError.badRequest('Pick at least one member');

  // Only friends may be added to a group (admins may add anyone).
  if (!isAdmin(req.user)) {
    const friendIds = new Set(req.user.friends.map(String));
    if (ids.some((id) => !friendIds.has(id))) throw ApiError.forbidden('You can only add your friends');
  }

  const conversation = await Conversation.create({
    isGroup: true,
    name: String(name).trim(),
    avatar: req.file ? (await storeFile(req.file)).url : '',
    members: [req.user._id, ...ids],
    admins: [req.user._id],
    createdBy: req.user._id,
    lastMessageAt: new Date(),
  });

  const populated = await populateConversation(Conversation.findById(conversation._id));
  const [decorated] = await withUnread([populated], req.user._id);
  emitToUsers(ids, SOCKET_EVENTS.CONVERSATION_NEW, { conversation: decorated });
  res.status(201).json({ success: true, conversation: decorated });
});

const assertGroupAdmin = (conversation, user) => {
  if (!conversation.isGroup) throw ApiError.badRequest('Not a group conversation');
  const allowed =
    isAdmin(user) || conversation.admins.some((a) => String(a._id || a) === String(user._id));
  if (!allowed) throw ApiError.forbidden('Only group admins can do that');
};

export const updateGroup = asyncHandler(async (req, res) => {
  const conversation = await loadConversation(req.params.id, req.user);
  assertGroupAdmin(conversation, req.user);

  if (req.body.name) conversation.name = String(req.body.name).trim();
  if (req.file) conversation.avatar = (await storeFile(req.file)).url;
  await conversation.save();

  const populated = await populateConversation(Conversation.findById(conversation._id));
  emitToUsers(populated.members.map((m) => m._id), SOCKET_EVENTS.CONVERSATION_UPDATED, {
    conversation: populated,
  });
  res.json({ success: true, conversation: populated });
});

export const addMembers = asyncHandler(async (req, res) => {
  const conversation = await loadConversation(req.params.id, req.user);
  assertGroupAdmin(conversation, req.user);

  const ids = (req.body.memberIds || []).map(String).filter(mongoose.isValidObjectId);
  if (!ids.length) throw ApiError.badRequest('No members provided');
  if (!isAdmin(req.user)) {
    const friendIds = new Set(req.user.friends.map(String));
    if (ids.some((id) => !friendIds.has(id))) throw ApiError.forbidden('You can only add your friends');
  }

  await Conversation.findByIdAndUpdate(conversation._id, { $addToSet: { members: { $each: ids } } });
  const populated = await populateConversation(Conversation.findById(conversation._id));
  emitToUsers(populated.members.map((m) => m._id), SOCKET_EVENTS.CONVERSATION_UPDATED, {
    conversation: populated,
  });
  res.json({ success: true, conversation: populated });
});

export const removeMember = asyncHandler(async (req, res) => {
  const conversation = await loadConversation(req.params.id, req.user);
  const { userId } = req.params;
  const isSelf = String(userId) === String(req.user._id);
  if (!isSelf) assertGroupAdmin(conversation, req.user);

  const previousMembers = conversation.members.map((m) => m._id);
  await Conversation.findByIdAndUpdate(conversation._id, {
    $pull: { members: userId, admins: userId },
  });

  const populated = await populateConversation(Conversation.findById(conversation._id));
  emitToUsers(previousMembers, SOCKET_EVENTS.CONVERSATION_UPDATED, { conversation: populated });
  res.json({ success: true, conversation: populated });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const conversation = await loadConversation(req.params.id, req.user);
  await Message.updateMany(
    { conversation: conversation._id, readBy: { $ne: req.user._id } },
    { $addToSet: { readBy: req.user._id } }
  );
  emitToUsers(
    conversation.members.map((m) => m._id),
    SOCKET_EVENTS.MESSAGE_READ,
    { conversationId: String(conversation._id), userId: String(req.user._id) }
  );
  res.json({ success: true, message: 'Conversation marked as read' });
});

export const deleteConversation = asyncHandler(async (req, res) => {
  const conversation = await loadConversation(req.params.id, req.user);
  const owner = String(conversation.createdBy) === String(req.user._id);
  if (!owner && !isAdmin(req.user)) throw ApiError.forbidden('Only the owner or an admin can delete this');

  const members = conversation.members.map((m) => m._id);
  // Collect attachments before the messages go, so their files can be cleaned up.
  const attachments = await Message.find({
    conversation: conversation._id,
    'attachment.publicId': { $nin: [null, ''] },
  }).select('attachment');

  await Promise.all([
    Message.deleteMany({ conversation: conversation._id }),
    Conversation.findByIdAndDelete(conversation._id),
  ]);
  await Promise.all(
    attachments.map((item) => removeFile(item.attachment.publicId, item.attachment.resourceType))
  );
  emitToUsers(members, SOCKET_EVENTS.CONVERSATION_UPDATED, {
    conversationId: String(conversation._id),
    deleted: true,
  });
  res.json({ success: true, message: 'Conversation deleted' });
});

export const listGroupCandidates = asyncHandler(async (req, res) => {
  const filter = isAdmin(req.user) ? { _id: { $ne: req.user._id } } : { _id: { $in: req.user.friends } };
  const users = await User.find(filter).select(MEMBER_FIELDS).sort({ name: 1 });
  res.json({ success: true, users });
});
