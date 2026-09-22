import dotenv from 'dotenv';

dotenv.config();

const required = ['mongo_uri', 'JWT_SECRET'];
const missing = required.filter((key) => !process.env[key]);

if (missing.length) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

export const env = {
  mongoUri: process.env.mongo_uri,
  port: Number(process.env.PORT) || 5000,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  // Accepts a comma-separated list so a fallback Vite port still passes CORS.
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173,http://localhost:5174')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean),
  admin: {
    name: process.env.ADMIN_NAME || 'Administrator',
    email: (process.env.ADMIN_EMAIL || 'admin@gmail.com').toLowerCase(),
    password: process.env.ADMIN_PASSWORD || 'admin123',
  },
  maxUploadBytes: (Number(process.env.MAX_UPLOAD_MB) || 20) * 1024 * 1024,
  isProd: process.env.NODE_ENV === 'production',
};
