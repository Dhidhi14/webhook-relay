import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';

export async function requireJwt(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError(401, 'Authentication required');
    }

    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, env.JWT_SECRET);

    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new AppError(401, 'Authentication required');
    }

    req.user = user;
    return next();
  } catch (err) {
    if (err instanceof AppError) {
      return next(err);
    }
    return next(new AppError(401, 'Authentication required'));
  }
}
