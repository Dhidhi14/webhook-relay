import { z } from 'zod';

const httpUrlSchema = z.url('must be a valid URL').refine(
  (url) => url.startsWith('http://') || url.startsWith('https://'),
  'must be a valid http or https URL',
);

const eventTypesSchema = z
  .array(z.string().min(1, 'must be a non-empty string'))
  .min(1, 'must contain at least one event type');

export const createEndpointSchema = z.object({
  url: httpUrlSchema,
  eventTypes: eventTypesSchema,
});

export const updateEndpointSchema = z
  .object({
    url: httpUrlSchema.optional(),
    eventTypes: eventTypesSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'at least one field must be provided',
  });
