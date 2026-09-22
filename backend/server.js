import http from 'node:http';
import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { initSocket } from './sockets/index.js';
import { seedAdmin } from './seed/adminSeed.js';

const start = async () => {
  await connectDB();
  await seedAdmin();

  const server = http.createServer(app);
  initSocket(server);

  server.listen(env.port, () => {
    console.log(`API ready on http://localhost:${env.port}`);
  });

  const shutdown = (signal) => {
    console.log(`\n${signal} received, shutting down`);
    server.close(() => process.exit(0));
  };
  ['SIGINT', 'SIGTERM'].forEach((signal) => process.on(signal, () => shutdown(signal)));
};

start().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});
