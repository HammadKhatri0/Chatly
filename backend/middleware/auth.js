import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyToken } from '../utils/token.js';
import { ROLES } from '../config/constants.js';

/** Reads a bearer token, loads the user and attaches it to req.user. */
export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw ApiError.unauthorized('Authentication token missing');

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid or expired token');
  }

  const user = await User.findById(payload.id);
  if (!user) throw ApiError.unauthorized('User no longer exists');
  if (user.isBlocked) throw ApiError.forbidden('Account is blocked');

  req.user = user;
  return next();
});

export const restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) return next(ApiError.forbidden('Insufficient permissions'));
    return next();
  };

export const adminOnly = restrictTo(ROLES.ADMIN);

export const isAdmin = (user) => user?.role === ROLES.ADMIN;
