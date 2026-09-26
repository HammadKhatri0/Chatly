import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import FriendRequest from '../models/FriendRequest.js';
import ApiError from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getPagination, escapeRegex } from '../utils/pagination.js';
import { storeFile } from '../middleware/upload.js';
import { ROLES } from '../config/constants.js';
import { populateConversation } from '../utils/conversationHelpers.js';

/** Everything an admin is allowed to write on another account. */
const ADMIN_EDITABLE = [
  'name',
  'email',
  'address',
  'work',
  'studies',
  'mobile',
  'about',
  'avatar',
  'role',
  'isBlocked',
];

export const getStats = asyncHandler(async (req, res) => {
  const [users, admins, groups, directChats, messages, pendingRequests, online] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: ROLES.ADMIN }),
    Conversation.countDocuments({ isGroup: true }),
    Conversation.countDocuments({ isGroup: false }),
    Message.countDocuments(),
    FriendRequest.countDocuments({ status: 'pending' }),
    User.countDocuments({ isOnline: true }),
  ]);
  res.json({
    success: true,
    stats: { users, admins, groups, directChats, messages, pendingRequests, online },
  });
});

export const listUsers = asyncHandler(async (req, res) => {
  const { q = '', role } = req.query;
  const { limit, skip, page } = getPagination(req.query, 20);
  const term = escapeRegex(String(q).trim());

  const filter = {};
  if (term) filter.$or = [{ name: new RegExp(term, 'i') }, { email: new RegExp(term, 'i') }];
  if (role && Object.values(ROLES).includes(role)) filter.role = role;

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  res.json({ success: true, users, total, page, pages: Math.ceil(total / limit) });
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate('friends', 'name email avatar');
  if (!user) throw ApiError.notFound('User not found');

  const [conversations, messages] = await Promise.all([
    Conversation.countDocuments({ members: user._id }),
    Message.countDocuments({ sender: user._id }),
  ]);
  res.json({ success: true, user, stats: { conversations, messages } });
});

export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role = ROLES.USER } = req.body;
  if (!name || !email || !password) throw ApiError.badRequest('Name, email and password are required');

  const exists = await User.findOne({ email: String(email).toLowerCase() });
  if (exists) throw ApiError.conflict('Email already registered');

  const user = await User.create({ name, email, password, role });
  res.status(201).json({ success: true, user });
});

/** Admins may change any profile field, the email, the role and the password. */
export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('+password');
  if (!user) throw ApiError.notFound('User not found');

  if (req.body.email && String(req.body.email).toLowerCase() !== user.email) {
    const taken = await User.findOne({ email: String(req.body.email).toLowerCase() });
    if (taken) throw ApiError.conflict('Email already in use');
  }

  ADMIN_EDITABLE.forEach((field) => {
    if (req.body[field] !== undefined && req.body[field] !== '') user[field] = req.body[field];
  });
  if (req.body.isBlocked !== undefined) user.isBlocked = req.body.isBlocked === true || req.body.isBlocked === 'true';
  if (req.file) user.avatar = (await storeFile(req.file)).url;

  if (req.body.password) {
    if (String(req.body.password).length < 6) throw ApiError.badRequest('Password must be at least 6 characters');
    user.password = req.body.password; // hashed by the model pre-save hook
  }

  // Never let the last remaining admin demote themselves out of the system.
  if (user.role !== ROLES.ADMIN) {
    const admins = await User.countDocuments({ role: ROLES.ADMIN, _id: { $ne: user._id } });
    if (!admins) throw ApiError.badRequest('At least one admin must remain');
  }

  await user.save();
  user.password = undefined;
  res.json({ success: true, user });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  if (String(user._id) === String(req.user._id)) throw ApiError.badRequest('You cannot delete your own account');

  if (user.role === ROLES.ADMIN) {
    const admins = await User.countDocuments({ role: ROLES.ADMIN, _id: { $ne: user._id } });
    if (!admins) throw ApiError.badRequest('At least one admin must remain');
  }

  await Promise.all([
    User.updateMany({ friends: user._id }, { $pull: { friends: user._id } }),
    Conversation.updateMany({ members: user._id }, { $pull: { members: user._id, admins: user._id } }),
    FriendRequest.deleteMany({ $or: [{ from: user._id }, { to: user._id }] }),
    Message.deleteMany({ sender: user._id }),
    user.deleteOne(),
  ]);

  res.json({ success: true, message: 'User deleted' });
});

export const listConversations = asyncHandler(async (req, res) => {
  const { limit, skip, page } = getPagination(req.query, 20);
  const [conversations, total] = await Promise.all([
    populateConversation(Conversation.find().sort({ lastMessageAt: -1 }).skip(skip).limit(limit)),
    Conversation.countDocuments(),
  ]);
  res.json({ success: true, conversations, total, page, pages: Math.ceil(total / limit) });
});
