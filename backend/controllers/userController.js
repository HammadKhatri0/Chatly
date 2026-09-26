import User from '../models/User.js';
import FriendRequest from '../models/FriendRequest.js';
import ApiError from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getPagination, escapeRegex } from '../utils/pagination.js';
import { storeFile } from '../middleware/upload.js';
import { REQUEST_STATUS } from '../config/constants.js';
import { MEMBER_FIELDS } from '../utils/conversationHelpers.js';

/** Fields a user may change on their own profile. */
const EDITABLE_FIELDS = ['name', 'address', 'work', 'studies', 'mobile', 'about', 'avatar'];

export const getMyProfile = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const updates = {};
  EDITABLE_FIELDS.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });
  if (req.file) updates.avatar = (await storeFile(req.file)).url;
  if (!Object.keys(updates).length) throw ApiError.badRequest('Nothing to update');

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });
  res.json({ success: true, user });
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select(
    `${MEMBER_FIELDS} address work studies mobile about friends`
  );
  if (!user) throw ApiError.notFound('User not found');
  res.json({ success: true, user });
});

/** Directory search, with the caller relationship to each result attached. */
export const searchUsers = asyncHandler(async (req, res) => {
  const { q = '' } = req.query;
  const { limit, skip, page } = getPagination(req.query, 20);
  const term = escapeRegex(String(q).trim());

  const filter = { _id: { $ne: req.user._id } };
  if (term) {
    filter.$or = [{ name: new RegExp(term, 'i') }, { email: new RegExp(term, 'i') }];
  }

  const [users, total, requests] = await Promise.all([
    User.find(filter).select(MEMBER_FIELDS).sort({ name: 1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
    FriendRequest.find({
      status: REQUEST_STATUS.PENDING,
      $or: [{ from: req.user._id }, { to: req.user._id }],
    }).lean(),
  ]);

  const friendIds = new Set(req.user.friends.map(String));
  const sent = new Map(
    requests.filter((r) => String(r.from) === String(req.user._id)).map((r) => [String(r.to), r._id])
  );
  const received = new Map(
    requests.filter((r) => String(r.to) === String(req.user._id)).map((r) => [String(r.from), r._id])
  );

  const data = users.map((user) => {
    const id = String(user._id);
    let relation = 'none';
    if (friendIds.has(id)) relation = 'friends';
    else if (sent.has(id)) relation = 'request_sent';
    else if (received.has(id)) relation = 'request_received';
    return { ...user.toObject(), relation, requestId: sent.get(id) || received.get(id) || null };
  });

  res.json({ success: true, users: data, page, total });
});
