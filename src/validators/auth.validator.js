import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'must be at least 8 characters')
  .regex(/[a-zA-Z]/, 'must contain at least one letter')
  .regex(/\d/, 'must contain at least one number');

export const registerSchema = z.object({
  email: z.email('must be a valid email address'),
  password: passwordSchema,
  name: z.string().min(1, 'is required'),
});

export const loginSchema = z.object({
  email: z.email('must be a valid email address'),
  password: z.string().min(1, 'is required'),
});
