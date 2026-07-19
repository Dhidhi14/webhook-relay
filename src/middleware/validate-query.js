import { AppError } from '../utils/app-error.js';

export function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const message = result.error.issues
        .map((issue) => {
          const field = issue.path.join('.') || 'query';
          return `${field}: ${issue.message}`;
        })
        .join('; ');

      return next(new AppError(400, message));
    }

    req.validatedQuery = result.data;
    return next();
  };
}
