import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'
import { config } from '../config/index.js'

const pool = new Pool({
  connectionString: config.DATABASE_URL,
})

const db = drizzle(pool)

async function main() {
  
  await migrate(db, { migrationsFolder: './src/db/migrations' })
  
  process.exit(0)
}

main().catch(() => {
  process.exit(1)
})