import axios from 'axios';
import Delivery from '../models/delivery.model.js';
import Endpoint from '../models/endpoint.model.js';
import Event from '../models/event.model.js';
import { AppError } from '../utils/app-error.js';
import { sign } from './signature.service.js';

export async function deliverOne(deliveryId, attemptNumber) {
  const delivery = await Delivery.findById(deliveryId);

  if (!delivery) {
    throw new AppError(404, 'Delivery not found');
  }

  const endpoint = await Endpoint.findById(delivery.endpoint).select('+secret');

  if (!endpoint) {
    throw new AppError(404, 'Endpoint not found');
  }

  const event = await Event.findById(delivery.event);

  if (!event) {
    throw new AppError(404, 'Event not found');
  }

  if (!endpoint.isActive) {
    await recordAttempt(delivery._id, {
      n: attemptNumber,
      at: new Date(),
      error: 'endpoint disabled',
    });

    await Delivery.findByIdAndUpdate(delivery._id, { status: 'dead' });
    return;
  }

  const body = JSON.stringify({
    id: delivery._id,
    event: event.type,
    timestamp: new Date().toISOString(),
    payload: event.payload,
  });

  const timestamp = Date.now().toString();
  const signature = sign(endpoint.secret, timestamp, body);
  const startedAt = Date.now();

  let httpStatus;
  let error;

  try {
    const response = await axios.post(endpoint.url, body, {
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Timestamp': timestamp,
        'X-Delivery-Id': delivery._id.toString(),
      },
      timeout: 5000,
      validateStatus: () => true,
    });

    httpStatus = response.status;
    const durationMs = Date.now() - startedAt;

    await recordAttempt(delivery._id, {
      n: attemptNumber,
      at: new Date(),
      httpStatus,
      durationMs,
    });

    if (httpStatus >= 200 && httpStatus < 300) {
      await Delivery.findByIdAndUpdate(delivery._id, { status: 'success' });
      endpoint.consecutiveDeadCount = 0;
      await endpoint.save();
      return;
    }

    error = `HTTP ${httpStatus}`;
  } catch (err) {
    const durationMs = Date.now() - startedAt;
    error = err.message;

    await recordAttempt(delivery._id, {
      n: attemptNumber,
      at: new Date(),
      error,
      durationMs,
    });
  }

  await Delivery.findByIdAndUpdate(delivery._id, { status: 'failed' });
  throw new Error(error || 'Delivery failed');
}

async function recordAttempt(deliveryId, attempt) {
  await Delivery.findByIdAndUpdate(deliveryId, {
    $push: { attempts: attempt },
  });
}
