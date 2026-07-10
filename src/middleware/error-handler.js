import { AppError } from '../utils/app-error.js';
import logger from '../utils/logger.js';

export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  }

  logger.error(err.message, { stack: err.stack });

  return res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
}
