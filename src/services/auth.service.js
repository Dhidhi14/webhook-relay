import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';

function generateApiKey() {
  return `whr_${crypto.randomBytes(16).toString('hex')}`;
}

export function signToken(userId) {
  return jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES });
}

export async function register(email, password, name) {
  const passwordHash = await bcrypt.hash(password, 10);
  const apiKey = generateApiKey();

  try {
    const user = await User.create({ email, passwordHash, name, apiKey });
    const token = signToken(user._id);

    return {
      user: user.toJSON(),
      token,
      apiKey,
    };
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError(409, 'Email already registered');
    }
    throw err;
  }
}

export async function login(email, password) {
  const user = await User.findOne({ email }).select('+passwordHash');

  if (!user) {
    throw new AppError(401, 'Invalid email or password');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);

  if (!isMatch) {
    throw new AppError(401, 'Invalid email or password');
  }

  const token = signToken(user._id);

  return {
    user: user.toJSON(),
    token,
  };
}

export async function rotateApiKey(userId) {
  const user = await User.findById(userId).select('+apiKey');

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  user.apiKey = generateApiKey();
  await user.save();

  return { apiKey: user.apiKey };
}
