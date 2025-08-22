import { z } from 'zod'
import * as dotenv from 'dotenv'

dotenv.config({ path: '../.env' })

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('51502'),
  HOST: z.string().default('127.0.0.1'),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string().min(32),
  REFRESH_SECRET: z.string().min(32),
  RATE_LIMIT_MAX: z.string().transform(Number).default('100'),
})

export const config = envSchema.parse(process.env)