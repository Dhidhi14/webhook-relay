import crypto from 'crypto';
import mongoose from 'mongoose';
import Endpoint from '../models/endpoint.model.js';
import { AppError } from '../utils/app-error.js';

async function findOwnedEndpoint(userId, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  return Endpoint.findOne({ _id: id, user: userId });
}

export async function createEndpoint(userId, data) {
  const secret = crypto.randomBytes(32).toString('hex');

  const endpoint = await Endpoint.create({
    user: userId,
    url: data.url,
    eventTypes: data.eventTypes,
    secret,
  });

  const result = endpoint.toJSON();
  result.secret = secret;

  return result;
}

export async function listEndpoints(userId) {
  const endpoints = await Endpoint.find({ user: userId }).sort({ createdAt: -1 });
  return endpoints.map((endpoint) => endpoint.toJSON());
}

export async function getEndpoint(userId, id) {
  const endpoint = await findOwnedEndpoint(userId, id);

  if (!endpoint) {
    throw new AppError(404, 'Endpoint not found');
  }

  return endpoint.toJSON();
}

export async function updateEndpoint(userId, id, data) {
  const endpoint = await findOwnedEndpoint(userId, id);

  if (!endpoint) {
    throw new AppError(404, 'Endpoint not found');
  }

  if (data.url !== undefined) {
    endpoint.url = data.url;
  }

  if (data.eventTypes !== undefined) {
    endpoint.eventTypes = data.eventTypes;
  }

  if (data.isActive !== undefined) {
    endpoint.isActive = data.isActive;

    if (data.isActive === true) {
      endpoint.consecutiveDeadCount = 0;
    }
  }

  await endpoint.save();

  return endpoint.toJSON();
}

export async function deleteEndpoint(userId, id) {
  const endpoint = await findOwnedEndpoint(userId, id);

  if (!endpoint) {
    throw new AppError(404, 'Endpoint not found');
  }

  await endpoint.deleteOne();
}
