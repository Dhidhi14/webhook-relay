import request from 'supertest';
import app from '../src/app.js';
import Delivery from '../src/models/delivery.model.js';
import { setEnqueueDelivery } from '../src/queues/delivery.queue.js';

describe('event ingestion e2e', () => {
  test('register, create endpoint, post event creates one pending delivery', async () => {
    const enqueued = [];

    setEnqueueDelivery(async (deliveryId) => {
      enqueued.push(deliveryId.toString());
    });

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'e2e@relay.com',
        password: 'Pass1234',
        name: 'E2E User',
      });

    const token = registerResponse.body.data.token;
    const apiKey = registerResponse.body.data.apiKey;

    await request(app)
      .post('/api/endpoints')
      .set('Authorization', `Bearer ${token}`)
      .send({
        url: 'https://webhook.site/e2e-test',
        eventTypes: ['order.created'],
      });

    const eventResponse = await request(app)
      .post('/api/events')
      .set('X-API-Key', apiKey)
      .send({
        type: 'order.created',
        payload: { orderId: '999' },
        idempotencyKey: 'evt-e2e-001',
      });

    const deliveries = await Delivery.find();
    const deliveryCount = await Delivery.countDocuments();

    expect(eventResponse.status).toBe(201);
    expect(eventResponse.body.success).toBe(true);
    expect(eventResponse.body.data.deliveriesCreated).toBe(1);
    expect(deliveryCount).toBe(1);
    expect(deliveries[0].status).toBe('pending');
    expect(enqueued).toHaveLength(1);
    expect(enqueued[0]).toBe(deliveries[0]._id.toString());
  });
});
