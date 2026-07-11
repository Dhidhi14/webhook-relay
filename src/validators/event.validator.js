import { z } from 'zod';

export const createEventSchema = z.object({
  type: z.string().min(1, 'is required'),
  payload: z.record(z.string(), z.unknown()),
  idempotencyKey: z.string().min(1, 'is required'),
});
