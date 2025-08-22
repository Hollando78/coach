import bcrypt from 'bcrypt'
import { randomBytes } from 'crypto'
import { db } from '../db/index.js'
import { refreshTokens } from '../db/schema.js'
import { eq, and, gt } from 'drizzle-orm'

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateRefreshToken(): string {
  return randomBytes(32).toString('hex')
}

export async function createRefreshToken(userId: string): Promise<string> {
  const token = generateRefreshToken()
  const saltRounds = 12
  const tokenHash = await bcrypt.hash(token, saltRounds)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  await db.insert(refreshTokens).values({
    userId,
    tokenHash,
    expiresAt,
  })

  return token
}

export async function verifyRefreshToken(token: string): Promise<string | null> {
  const tokens = await db
    .select()
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.revoked, false),
        gt(refreshTokens.expiresAt, new Date())
      )
    )

  for (const storedToken of tokens) {
    if (await bcrypt.compare(token, storedToken.tokenHash)) {
      return storedToken.userId
    }
  }

  return null
}

export async function revokeRefreshToken(token: string): Promise<void> {
  const tokens = await db.select().from(refreshTokens)
  
  for (const storedToken of tokens) {
    if (await bcrypt.compare(token, storedToken.tokenHash)) {
      await db
        .update(refreshTokens)
        .set({ revoked: true })
        .where(eq(refreshTokens.id, storedToken.id))
      break
    }
  }
}