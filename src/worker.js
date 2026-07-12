import { Worker } from 'bullmq';
import { connectDB, disconnectDB } from './config/db.js';
import redis from './config/redis.js';
import { deliverOne } from './services/delivery.service.js';
import logger from './utils/logger.js';

let worker;

async function shutdown(signal) {
  logger.info(`${signal} received, shutting down worker gracefully`);

  if (worker) {
    await worker.close();
    logger.info('Worker closed');
  }

  await disconnectDB();
  redis.disconnect();
  logger.info('Redis disconnected');

  process.exit(0);
}

async function start() {
  await connectDB();

  worker = new Worker(
    'deliveries',
    async (job) => {
      await deliverOne(job.data.deliveryId, job.attemptsMade + 1);
    },
    {
      connection: redis,
      concurrency: 5,
    },
  );

  worker.on('completed', (job) => {
    logger.info(`Delivery job ${job.id} completed for delivery ${job.data.deliveryId}`);
  });

  worker.on('failed', (job, err) => {
    logger.error(
      `Delivery job ${job?.id} failed for delivery ${job?.data?.deliveryId}: ${err.message}`,
    );
  });

  logger.info('Delivery worker started');

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((err) => {
  logger.error(`Failed to start worker: ${err.message}`);
  process.exit(1);
});
