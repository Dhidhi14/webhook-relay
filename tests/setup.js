import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import redis from '../src/config/redis.js';
import deliveryQueue, { setEnqueueDelivery } from '../src/queues/delivery.queue.js';

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

beforeEach(async () => {
  const { collections } = mongoose.connection;

  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({})),
  );
});

afterEach(() => {
  setEnqueueDelivery(null);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
  await deliveryQueue.close();
  await redis.quit();
});
