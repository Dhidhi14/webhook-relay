import app from './app.js';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import redis from './config/redis.js';
import logger from './utils/logger.js';

let server;

async function shutdown(signal) {
  logger.info(`${signal} received, shutting down gracefully`);

  if (server) {
    await new Promise((resolve) => server.close(resolve));
    logger.info('HTTP server closed');
  }

  await disconnectDB();
  redis.disconnect();
  logger.info('Redis disconnected');

  process.exit(0);
}

async function start() {
  await connectDB();

  server = app.listen(env.PORT, () => {
    logger.info(`Server listening on port ${env.PORT}`);
  });

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((err) => {
  logger.error(`Failed to start server: ${err.message}`);
  process.exit(1);
});
