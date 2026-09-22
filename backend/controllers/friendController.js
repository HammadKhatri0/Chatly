import mongoose from 'mongoose';
import User from '../models/User.js';
import FriendRequest from '../models/FriendRequest.js';
import ApiError from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { REQUEST_STATUS, SOCKET_EVENTS } from '../config/constants.js';
import { emitToUsers } from '../sockets/registry.js';
import { MEMBER_FIELDS } from '../utils/conversationHelpers.js';

export const listFriends = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('friends', MEMBER_FIELDS);
  res.json({ success: true, friends: user.friends });
});

export const listRequests = asyncHandler(async (req, res) => {
  const [incoming, outgoing] = await Promise.all([
    FriendRequest.find({ to: req.user._id, status: REQUEST_STATUS.PENDING })
      .populate('from', MEMBER_FIELDS)
      .sort({ createdAt: -1 }),
    FriendRequest.find({ from: req.user._id, status: REQUEST_STATUS.PENDING })
      .populate('to', MEMBER_FIELDS)
      .sort({ createdAt: -1 }),
  ]);
  res.json({ success: true, incoming, outgoing });
});

export const sendRequest = asyncHandler(async (req, res) => {
  const targetId = req.body.userId || req.params.id;
  if (!mongoose.isValidObjectId(targetId)) throw ApiError.badRequest('Invalid user id');
  if (String(targetId) === String(req.user._id)) throw ApiError.badRequest('You cannot add yourself');

  const target = await User.findById(targetId);
  if (!target) throw ApiError.notFound('User not found');
  if (req.user.friends.some((id) => String(id) === String(targetId))) {
    throw ApiError.conflict('You are already friends');
  }

  const existing = await FriendRequest.findOne({
    status: REQUEST_STATUS.PENDING,
    $or: [
      { from: req.user._id, to: targetId },
      { from: targetId, to: req.user._id },
    ],
  });
  if (existing) throw ApiError.conflict('A pending request already exists');

  // Re-use a previously rejected row so the unique (from, to) index never trips.
  const request = await FriendRequest.findOneAndUpdate(
    { from: req.user._id, to: targetId },
    { status: REQUEST_STATUS.PENDING },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).populate('from', MEMBER_FIELDS);

  emitToUsers([targetId], SOCKET_EVENTS.FRIEND_REQUEST, { request });
  res.status(201).json({ success: true, request });
});

export const respondToRequest = asyncHandler(async (req, res) => {
  const { action } = req.body; // accept | reject
  if (!['accept', 'reject'].includes(action)) {
    throw ApiError.badRequest('Action must be accept or reject');
  }

  const request = await FriendRequest.findById(req.params.id);
  if (!request) throw ApiError.notFound('Request not found');
  if (String(request.to) !== String(req.user._id)) throw ApiError.forbidden('This request is not yours');
  if (request.status !== REQUEST_STATUS.PENDING) throw ApiError.badRequest('Request already handled');

  request.status = action === 'accept' ? REQUEST_STATUS.ACCEPTED : REQUEST_STATUS.REJECTED;
  await request.save();

  if (action === 'accept') {
    await Promise.all([
      User.findByIdAndUpdate(request.from, { $addToSet: { friends: request.to } }),
      User.findByIdAndUpdate(request.to, { $addToSet: { friends: request.from } }),
    ]);
  }

  emitToUsers([request.from, request.to], SOCKET_EVENTS.FRIEND_UPDATE, {
    requestId: request._id,
    status: request.status,
  });
  res.json({ success: true, request });
});

export const cancelRequest = asyncHandler(async (req, res) => {
  const request = await FriendRequest.findById(req.params.id);
  if (!request) throw ApiError.notFound('Request not found');
  if (String(request.from) !== String(req.user._id)) throw ApiError.forbidden('This request is not yours');

  await request.deleteOne();
  emitToUsers([request.to], SOCKET_EVENTS.FRIEND_UPDATE, {
    requestId: request._id,
    status: 'cancelled',
  });
  res.json({ success: true, message: 'Request cancelled' });
});

export const unfriend = asyncHandler(async (req, res) => {
  const friendId = req.params.id;
  if (!mongoose.isValidObjectId(friendId)) throw ApiError.badRequest('Invalid user id');

  await Promise.all([
    User.findByIdAndUpdate(req.user._id, { $pull: { friends: friendId } }),
    User.findByIdAndUpdate(friendId, { $pull: { friends: req.user._id } }),
    FriendRequest.deleteMany({
      $or: [
        { from: req.user._id, to: friendId },
        { from: friendId, to: req.user._id },
      ],
    }),
  ]);

  emitToUsers([friendId], SOCKET_EVENTS.FRIEND_UPDATE, {
    userId: String(req.user._id),
    status: 'unfriended',
  });
  res.json({ success: true, message: 'Friend removed' });
});
