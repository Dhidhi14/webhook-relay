import User from '../src/models/user.model.js';
import Endpoint from '../src/models/endpoint.model.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { register, signToken } from '../src/services/auth.service.js';
import { createEndpoint } from '../src/services/endpoint.service.js';
import { ingestEvent } from '../src/services/event.service.js';
import logger from '../src/utils/logger.js';

const DEMO_EMAIL = 'demo@webhookrelay.local';
const DEMO_PASSWORD = 'DemoPass1234';
const DEMO_NAME = 'Demo User';
const WEBHOOK_URL = process.env.SEED_WEBHOOK_URL ?? 'https://webhook.site/placeholder';
const EVENT_TYPES = ['order.created', 'payment.success', 'user.signup'];

const SAMPLE_EVENTS = [
  {
    type: 'order.created',
    payload: { orderId: 'seed-1001', total: 49.99 },
    idempotencyKey: 'seed-order-001',
  },
  {
    type: 'payment.success',
    payload: { paymentId: 'seed-pay-001', amount: 49.99 },
    idempotencyKey: 'seed-payment-001',
  },
  {
    type: 'user.signup',
    payload: { userId: 'seed-user-001', plan: 'free' },
    idempotencyKey: 'seed-signup-001',
  },
];

async function ensureDemoUser() {
  let user = await User.findOne({ email: DEMO_EMAIL }).select('+apiKey');
  let created = false;

  if (!user) {
    const result = await register(DEMO_EMAIL, DEMO_PASSWORD, DEMO_NAME);
    user = await User.findById(result.user._id).select('+apiKey');
    created = true;
  }

  const token = signToken(user._id);

  return {
    user,
    token,
    apiKey: user.apiKey,
    created,
  };
}

async function ensureDemoEndpoint(userId) {
  let endpoint = await Endpoint.findOne({ user: userId, url: WEBHOOK_URL });
  let created = false;

  if (!endpoint) {
    endpoint = await createEndpoint(userId, {
      url: WEBHOOK_URL,
      eventTypes: EVENT_TYPES,
    });
    created = true;
  }

  return { endpoint, created };
}

async function seedEvents(userId) {
  const results = [];

  for (const eventData of SAMPLE_EVENTS) {
    const result = await ingestEvent(userId, eventData);
    results.push({
      type: eventData.type,
      idempotencyKey: eventData.idempotencyKey,
      duplicate: result.duplicate,
      deliveriesCreated: result.deliveriesCreated,
    });
  }

  return results;
}

try {
  await connectDB();

  const { user, token, apiKey, created: userCreated } = await ensureDemoUser();
  const { endpoint, created: endpointCreated } = await ensureDemoEndpoint(user._id);
  const eventResults = await seedEvents(user._id);

  const output = {
    user: {
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      created: userCreated,
    },
    credentials: {
      token,
      apiKey,
    },
    endpoint: {
      url: endpoint.url,
      eventTypes: endpoint.eventTypes ?? EVENT_TYPES,
      created: endpointCreated,
    },
    events: eventResults,
  };

  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
} catch (err) {
  logger.error(`Seed failed: ${err.message}`);
  process.exitCode = 1;
} finally {
  await disconnectDB();
}
