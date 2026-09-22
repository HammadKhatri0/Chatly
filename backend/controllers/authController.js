import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { signToken } from '../utils/token.js';
import { ROLES } from '../config/constants.js';

const authResponse = (res, user, status = 200) =>
  res.status(status).json({ success: true, token: signToken(user), user });

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) throw ApiError.badRequest('Name, email and password are required');
  if (String(password).length < 6) throw ApiError.badRequest('Password must be at least 6 characters');

  const exists = await User.findOne({ email: String(email).toLowerCase() });
  if (exists) throw ApiError.conflict('Email already registered');

  // Role is never taken from the request body: new accounts are always regular users.
  const user = await User.create({ name, email, password, role: ROLES.USER });
  return authResponse(res, user, 201);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw ApiError.badRequest('Email and password are required');

  const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  if (user.isBlocked) throw ApiError.forbidden('Account is blocked, contact an administrator');

  user.password = undefined;
  return authResponse(res, user);
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) throw ApiError.badRequest('Both passwords are required');
  if (String(newPassword).length < 6) throw ApiError.badRequest('Password must be at least 6 characters');

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) throw ApiError.badRequest('Current password is wrong');

  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password updated' });
});
