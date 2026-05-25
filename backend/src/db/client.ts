import { mkdirSync } from 'node:fs'
import Database from 'better-sqlite3'
import { Kysely, SqliteDialect } from 'kysely'
import type { Database as DB } from './schema.js'

mkdirSync('./data', { recursive: true })
const db = new Database(process.env.DATABASE_URL ?? './data/musiclink.db')

export const kysely = new Kysely<DB>({
  dialect: new SqliteDialect({ database: db }),
})
