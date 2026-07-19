import { Queue } from 'bullmq';
import redis from '../config/redis.js';
import { env } from '../config/env.js';

const deliveryQueue = new Queue('deliveries', {
  connection: redis,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: env.BACKOFF_DELAY_MS,
    },
    removeOnComplete: 100,
    removeOnFail: false,
  },
});

let enqueueOverride = null;

export function setEnqueueDelivery(fn) {
  enqueueOverride = fn;
}

export async function enqueueDelivery(deliveryId) {
  if (enqueueOverride) {
    return enqueueOverride(deliveryId);
  }

  await deliveryQueue.add('deliver', { deliveryId: deliveryId.toString() });
}

export default deliveryQueue;
