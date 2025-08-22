import { db } from './index.js'
import { users, scores } from './schema.js'
import { hashPassword } from '../services/auth.js'

async function seed() {
  
  // Create demo user
  const passwordHash = await hashPassword('password123')
  
  const [demoUser] = await db
    .insert(users)
    .values({
      email: 'demo@example.com',
      passwordHash,
      displayName: 'Demo Player',
    })
    .returning()
    .catch(() => []) // Ignore if user already exists
  
  if (demoUser) {
  }
  
  // Create some demo scores
  const demoScores = [
    {
      userId: demoUser?.id || null,
      score: 125000,
      mode: 'normal' as const,
      waveReached: 15,
      durationMs: 900000,
      seed: 'demo1',
      clientVersion: '1.0.0',
    },
    {
      userId: demoUser?.id || null,
      score: 89000,
      mode: 'normal' as const,
      waveReached: 12,
      durationMs: 650000,
      seed: 'demo2',
      clientVersion: '1.0.0',
    },
    {
      userId: null, // Anonymous score
      score: 156000,
      mode: 'normal' as const,
      waveReached: 18,
      durationMs: 1100000,
      seed: 'anon1',
      clientVersion: '1.0.0',
    },
  ]
  
  for (const score of demoScores) {
    await db.insert(scores).values(score).catch(() => {})
  }
  
}

seed().catch(() => {})