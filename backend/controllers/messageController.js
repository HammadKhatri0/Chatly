import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import ApiError from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getPagination, escapeRegex } from '../utils/pagination.js';
import { storeFile, removeFile } from '../middleware/upload.js';
import { MESSAGE_TYPES, SOCKET_EVENTS } from '../config/constants.js';
import { emitToUsers } from '../sockets/registry.js';
import { isAdmin } from '../middleware/auth.js';
import { isMember, populateConversation } from '../utils/conversationHelpers.js';

const SENDER_FIELDS = 'name avatar email isOnline';

const loadForUser = async (conversationId, user) => {
  if (!mongoose.isValidObjectId(conversationId)) throw ApiError.badRequest('Invalid conversation id');
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw ApiError.notFound('Conversation not found');
  if (!isMember(conversation, user._id) && !isAdmin(user)) {
    throw ApiError.forbidden('You are not part of this conversation');
  }
  return conversation;
};

const typeFromMime = (mimetype = '') => {
  if (mimetype.startsWith('image/')) return MESSAGE_TYPES.IMAGE;
  if (mimetype.startsWith('audio/')) return MESSAGE_TYPES.AUDIO;
  return MESSAGE_TYPES.FILE;
};

/** Newest-first page of messages; the client reverses for display. */
export const listMessages = asyncHandler(async (req, res) => {
  const conversation = await loadForUser(req.params.id, req.user);
  const { limit, skip, page } = getPagination(req.query, 30, 100);

  const [messages, total] = await Promise.all([
    Message.find({ conversation: conversation._id, deletedFor: { $ne: req.user._id } })
      .populate('sender', SENDER_FIELDS)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Message.countDocuments({ conversation: conversation._id }),
  ]);

  res.json({ success: true, messages: messages.reverse(), page, total, hasMore: skip + limit < total });
});

export const sendMessage = asyncHandler(async (req, res) => {
  const conversation = await loadForUser(req.params.id, req.user);
  const text = (req.body.text || '').trim();

  if (!text && !req.file) throw ApiError.badRequest('Message cannot be empty');

  const stored = await storeFile(req.file);
  const attachment = stored
    ? {
        url: stored.url,
        publicId: stored.publicId,
        resourceType: stored.resourceType,
        name: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        duration: Number(req.body.duration) || 0,
      }
    : null;

  const type = req.file
    ? req.body.type === MESSAGE_TYPES.AUDIO
      ? MESSAGE_TYPES.AUDIO
      : typeFromMime(req.file.mimetype)
    : MESSAGE_TYPES.TEXT;

  const message = await Message.create({
    conversation: conversation._id,
    sender: req.user._id,
    type,
    text,
    attachment,
    readBy: [req.user._id],
  });

  conversation.lastMessage = message._id;
  conversation.lastMessageAt = message.createdAt;
  await conversation.save();

  const populated = await message.populate('sender', SENDER_FIELDS);
  const fullConversation = await populateConversation(Conversation.findById(conversation._id));

  emitToUsers(conversation.members, SOCKET_EVENTS.MESSAGE_NEW, {
    message: populated,
    conversation: fullConversation,
  });

  res.status(201).json({ success: true, message: populated });
});

/** Search inside one conversation, or across every conversation the user belongs to. */
export const searchMessages = asyncHandler(async (req, res) => {
  const { q = '', conversationId } = req.query;
  const term = escapeRegex(String(q).trim());
  if (!term) return res.json({ success: true, messages: [] });

  const { limit, skip } = getPagination(req.query, 30, 100);
  const filter = { text: new RegExp(term, 'i') };

  if (conversationId) {
    const conversation = await loadForUser(conversationId, req.user);
    filter.conversation = conversation._id;
  } else {
    const ids = await Conversation.find({ members: req.user._id }).distinct('_id');
    filter.conversation = { $in: ids };
  }

  const messages = await Message.find(filter)
    .populate('sender', SENDER_FIELDS)
    .populate({ path: 'conversation', select: 'name isGroup members', populate: { path: 'members', select: 'name avatar' } })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return res.json({ success: true, messages });
});

export const deleteMessage = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.messageId);
  if (!message) throw ApiError.notFound('Message not found');

  const owner = String(message.sender) === String(req.user._id);
  if (!owner && !isAdmin(req.user)) throw ApiError.forbidden('You can only delete your own messages');

  const conversation = await Conversation.findById(message.conversation);
  await message.deleteOne();
  // Drop the stored file too, so deleted messages do not leave orphans behind.
  await removeFile(message.attachment?.publicId, message.attachment?.resourceType);

  emitToUsers(conversation?.members || [], SOCKET_EVENTS.CONVERSATION_UPDATED, {
    conversationId: String(message.conversation),
    deletedMessageId: String(message._id),
  });
  res.json({ success: true, message: 'Message deleted' });
});
