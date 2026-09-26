import path from 'node:path';
import crypto from 'node:crypto';
import fs from 'node:fs';
import multer from 'multer';
import { env, usingCloudinary } from '../config/env.js';
import cloudinary from '../config/cloudinary.js';
import ApiError from '../utils/ApiError.js';

const uploadDir = path.resolve('uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const ALLOWED = /^(image\/(png|jpe?g|gif|webp|svg\+xml)|audio\/|video\/|application\/(pdf|zip|msword|vnd\.|octet-stream)|text\/)/;

const randomName = (originalname) => {
  const ext = path.extname(originalname).slice(0, 12);
  return `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
};

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, randomName(file.originalname)),
});

/**
 * Cloudinary uploads stream from memory, so multer keeps the file in a buffer.
 * Without credentials the app falls back to disk, which keeps a fresh clone
 * runnable and avoids spending quota during local development.
 */
export const upload = multer({
  storage: usingCloudinary ? multer.memoryStorage() : diskStorage,
  limits: { fileSize: env.maxUploadBytes },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED.test(file.mimetype)) return cb(ApiError.badRequest('Unsupported file type'));
    return cb(null, true);
  },
});

const uploadToCloudinary = (file) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: env.cloudinary.folder,
        // 'auto' routes images, audio/video and raw documents to the right pipeline;
        // hardcoding a type would break voice notes and PDFs.
        resource_type: 'auto',
        public_id: path.parse(randomName(file.originalname)).name,
      },
      (error, result) => {
        if (error) return reject(ApiError.badRequest(`Upload failed: ${error.message}`));
        return resolve({
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type,
          bytes: result.bytes,
        });
      }
    );
    stream.end(file.buffer);
  });

/**
 * Persists an uploaded file and returns where it now lives.
 * Callers get the same shape whichever backing store is active.
 */
export const storeFile = async (file) => {
  if (!file) return null;
  if (usingCloudinary) return uploadToCloudinary(file);
  return {
    url: `/uploads/${file.filename}`,
    publicId: '',
    resourceType: '',
    bytes: file.size,
  };
};

/** Best-effort cleanup; a failure here must never break the request that triggered it. */
export const removeFile = async (publicId, resourceType = 'image') => {
  if (!usingCloudinary || !publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType || 'image' });
  } catch (error) {
    console.error(`Could not remove ${publicId} from Cloudinary:`, error.message);
  }
};
