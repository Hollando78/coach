import { pgTable, uuid, text, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core'
import { z } from 'zod'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  displayName: text('display_name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  revoked: boolean('revoked').default(false).notNull(),
})

export const saves = pgTable('saves', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  blob: jsonb('blob').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const scores = pgTable('scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  score: integer('score').notNull(),
  mode: text('mode').notNull(),
  waveReached: integer('wave_reached').notNull(),
  durationMs: integer('duration_ms').notNull(),
  seed: text('seed').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  clientVersion: text('client_version').notNull(),
})

// Zod schemas
export const insertUserSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1).max(50),
  passwordHash: z.string(),
})

export const insertScoreSchema = z.object({
  score: z.number().min(0).max(1000000),
  mode: z.enum(['normal', 'hard', 'endless']),
  waveReached: z.number().min(1).max(100),
  durationMs: z.number().min(0),
  seed: z.string().min(1).max(100),
  clientVersion: z.string(),
})

export const saveSchema = z.object({
  gameState: z.object({
    wave: z.number(),
    lives: z.number(),
    cash: z.number(),
    towers: z.array(z.any()),
    creeps: z.array(z.any()),
    seed: z.string(),
  }),
})

export type User = typeof users.$inferSelect
export type Score = typeof scores.$inferSelect
export type Save = typeof saves.$inferSelect