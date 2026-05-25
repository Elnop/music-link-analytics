import Database from 'better-sqlite3'
import { Kysely, SqliteDialect } from 'kysely'
import type { Database as DB } from './schema.js'

const db = new Database(process.env.DATABASE_URL ?? './data/musiclink.db')

export const kysely = new Kysely<DB>({
  dialect: new SqliteDialect({ database: db }),
})
