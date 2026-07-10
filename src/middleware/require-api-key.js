import User from '../models/user.model.js';
import { AppError } from '../utils/app-error.js';

export async function requireApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return next(new AppError(401, 'API key required'));
  }

  const user = await User.findOne({ apiKey }).select('+apiKey');

  if (!user) {
    return next(new AppError(401, 'Invalid API key'));
  }

  req.user = user;
  return next();
}
