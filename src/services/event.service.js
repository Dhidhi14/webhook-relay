import Event from '../models/event.model.js';
import Delivery from '../models/delivery.model.js';
import Endpoint from '../models/endpoint.model.js';
import { enqueueDelivery } from '../queues/delivery.queue.js';

export async function ingestEvent(userId, data) {
  try {
    const event = await Event.create({
      user: userId,
      type: data.type,
      payload: data.payload,
      idempotencyKey: data.idempotencyKey,
    });

    const deliveriesCreated = await fanOut(event);

    return {
      event,
      duplicate: false,
      deliveriesCreated,
    };
  } catch (err) {
    if (err.code === 11000) {
      const event = await Event.findOne({
        user: userId,
        idempotencyKey: data.idempotencyKey,
      });

      return {
        event,
        duplicate: true,
        deliveriesCreated: 0,
      };
    }

    throw err;
  }
}

async function fanOut(event) {
  const endpoints = await Endpoint.find({
    user: event.user,
    isActive: true,
    eventTypes: event.type,
  });

  let deliveriesCreated = 0;

  for (const endpoint of endpoints) {
    const delivery = await Delivery.create({
      event: event._id,
      endpoint: endpoint._id,
      user: event.user,
      status: 'pending',
    });

    await enqueueDelivery(delivery._id);
    deliveriesCreated += 1;
  }

  return deliveriesCreated;
}
