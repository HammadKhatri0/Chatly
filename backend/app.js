import path from 'node:path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/error.js';

const app = express();

// Render (and any reverse proxy) forwards the real client IP in X-Forwarded-For.
// Without this the rate limiter sees one proxy IP and throttles every user together.
if (env.isProd) app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: env.clientUrls, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.resolve('uploads'), { maxAge: '7d' }));
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
