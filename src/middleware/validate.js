import { AppError } from '../utils/app-error.js';

export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const message = result.error.issues
        .map((issue) => {
          const field = issue.path.join('.') || 'body';
          return `${field}: ${issue.message}`;
        })
        .join('; ');

      return next(new AppError(400, message));
    }

    req.body = result.data;
    return next();
  };
}
