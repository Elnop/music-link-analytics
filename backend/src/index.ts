import 'dotenv/config'
import { mkdirSync } from 'node:fs'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { runMigrations } from './db/migrate.js'
import { search } from './routes/search.js'
import { musicLinks } from './routes/musicLinks.js'

mkdirSync('./data', { recursive: true })
await runMigrations()

const app = new Hono()
app.use('*', cors({ origin: 'http://localhost:5173' }))
app.get('/health', (c) => c.json({ ok: true }))
app.route('/api/search', search)
app.route('/api/tracks', search)
app.route('/api/music-links', musicLinks)

const port = Number(process.env.PORT) || 3001
serve({ fetch: app.fetch, port }, () => {
  console.log(`Backend running on http://localhost:${port}`)
})

export default app
