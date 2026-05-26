import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import Database from 'better-sqlite3';
import { Kysely, SqliteDialect } from 'kysely';
import type { Database as DB } from './schema.js';

const dbPath = process.env.DATABASE_URL ?? './data/musiclink.db';
mkdirSync(dirname(dbPath), { recursive: true });
const db = new Database(dbPath);

export const kysely = new Kysely<DB>({
	dialect: new SqliteDialect({ database: db }),
});
