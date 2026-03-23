import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4451),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  // AWS config (non-secret — just region/resource names)
  AWS_REGION: z.string().default('us-east-1'),
  AWS_SECRET_NAME: z.string().default('hms/app-secrets'),
  // Log level
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment variables:', result.error.flatten().fieldErrors);
    process.exit(1);
  }
  return result.data;
}

export const env = validateEnv();
