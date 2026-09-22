import path from 'node:path';
import crypto from 'node:crypto';
import fs from 'node:fs';
import multer from 'multer';
import { env } from '../config/env.js';
import ApiError from '../utils/ApiError.js';

const uploadDir = path.resolve('uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const ALLOWED = /^(image\/(png|jpe?g|gif|webp|svg\+xml)|audio\/|video\/|application\/(pdf|zip|msword|vnd\.|octet-stream)|text\/)/;

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).slice(0, 12);
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: env.maxUploadBytes },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED.test(file.mimetype)) return cb(ApiError.badRequest('Unsupported file type'));
    return cb(null, true);
  },
});

export const fileUrl = (file) => `/uploads/${file.filename}`;
