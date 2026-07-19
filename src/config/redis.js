import Redis from 'ioredis';
import { env } from './env.js';
import logger from '../utils/logger.js';

const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

redis.on('error', (err) => {
  logger.error(`Redis connection error: ${err.message}`);
});

redis.on('connect', () => {
  logger.info('Redis connected');
});

export default redis;
