import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES: z.string().default('7d'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  BACKOFF_DELAY_MS: z.coerce.number().default(30000),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const messages = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
  process.stderr.write(`Environment validation failed:\n${messages.join('\n')}\n`);
  process.exit(1);
}

export const env = Object.freeze(result.data);
