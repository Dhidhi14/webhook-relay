import request from 'supertest';
import app from '../src/app.js';
import Event from '../src/models/event.model.js';

describe('event idempotency', () => {
  test('duplicate idempotencyKey creates one event and returns duplicate on second post', async () => {
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'idempotent@relay.com',
        password: 'Pass1234',
        name: 'Idempotent User',
      });

    const apiKey = registerResponse.body.data.apiKey;

    await request(app)
      .post('/api/endpoints')
      .set('Authorization', `Bearer ${registerResponse.body.data.token}`)
      .send({
        url: 'https://webhook.site/test-idempotency',
        eventTypes: ['payment.success'],
      });

    const payload = {
      type: 'payment.success',
      payload: { orderId: '123' },
      idempotencyKey: 'evt-idempotent-001',
    };

    const firstResponse = await request(app)
      .post('/api/events')
      .set('X-API-Key', apiKey)
      .send(payload);

    const secondResponse = await request(app)
      .post('/api/events')
      .set('X-API-Key', apiKey)
      .send(payload);

    const eventCount = await Event.countDocuments();

    expect(firstResponse.status).toBe(201);
    expect(firstResponse.body.success).toBe(true);
    expect(firstResponse.body.data.duplicate).toBe(false);

    expect(secondResponse.status).toBe(201);
    expect(secondResponse.body.success).toBe(true);
    expect(secondResponse.body.data.duplicate).toBe(true);
    expect(secondResponse.body.data.deliveriesCreated).toBe(0);
    expect(eventCount).toBe(1);
  });
});
