import { z } from 'zod';

export const listDeliveriesQuerySchema = z.object({
  eventId: z.string().optional(),
  endpointId: z.string().optional(),
  status: z.enum(['pending', 'success', 'failed', 'dead']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});
