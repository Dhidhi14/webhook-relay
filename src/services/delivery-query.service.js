import mongoose from 'mongoose';
import Delivery from '../models/delivery.model.js';
import { enqueueDelivery } from '../queues/delivery.queue.js';
import { AppError } from '../utils/app-error.js';

async function findOwnedDelivery(userId, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  return Delivery.findOne({ _id: id, user: userId });
}

export async function listDeliveries(userId, filters = {}) {
  const page = Math.max(1, Number(filters.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20));

  const query = { user: userId };

  if (filters.eventId && mongoose.Types.ObjectId.isValid(filters.eventId)) {
    query.event = filters.eventId;
  }

  if (filters.endpointId && mongoose.Types.ObjectId.isValid(filters.endpointId)) {
    query.endpoint = filters.endpointId;
  }

  if (filters.status) {
    query.status = filters.status;
  }

  const total = await Delivery.countDocuments(query);
  const items = await Delivery.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('event', 'type')
    .populate('endpoint', 'url')
    .lean();

  return {
    items,
    page,
    totalPages: Math.ceil(total / limit) || 0,
    total,
  };
}

export async function getDelivery(userId, id) {
  const delivery = await Delivery.findOne({ _id: id, user: userId })
    .populate('event', 'type payload idempotencyKey')
    .populate('endpoint', 'url eventTypes isActive');

  if (!delivery) {
    throw new AppError(404, 'Delivery not found');
  }

  return delivery;
}

export async function replayDelivery(userId, id) {
  const delivery = await findOwnedDelivery(userId, id);

  if (!delivery) {
    throw new AppError(404, 'Delivery not found');
  }

  if (delivery.status !== 'dead') {
    throw new AppError(400, 'Only dead deliveries can be replayed');
  }

  delivery.status = 'pending';
  await delivery.save();
  await enqueueDelivery(delivery._id);

  return delivery;
}

export async function getStats(userId) {
  const [result] = await Delivery.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        success: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
        failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
        dead: { $sum: { $cond: [{ $eq: ['$status', 'dead'] }, 1, 0] } },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        totalAttempts: { $sum: { $size: '$attempts' } },
      },
    },
  ]);

  const stats = result ?? {
    total: 0,
    success: 0,
    failed: 0,
    dead: 0,
    pending: 0,
    totalAttempts: 0,
  };

  const successRate = stats.total > 0 ? (stats.success / stats.total) * 100 : 0;
  const avgAttempts = stats.total > 0 ? stats.totalAttempts / stats.total : 0;

  return {
    total: stats.total,
    success: stats.success,
    failed: stats.failed,
    dead: stats.dead,
    pending: stats.pending,
    successRate: Math.round(successRate * 100) / 100,
    avgAttempts: Math.round(avgAttempts * 100) / 100,
  };
}
