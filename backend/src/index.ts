import 'dotenv/config';
import { mkdirSync } from 'node:fs';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { runMigrations } from './db/migrate.js';
import { seedIfEmpty } from './scripts/seed.js';
import { search } from './routes/search.js';
import { musicLinks } from './routes/musicLinks.js';
import { events } from './routes/events.js';

mkdirSync('./data', { recursive: true });
await runMigrations();
await seedIfEmpty();

const app = new Hono();
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use('*', cors({ origin: allowedOrigin }));
app.get('/health', (c) => c.json({ ok: true }));
app.route('/api/search', search);
app.route('/api/tracks', search);
app.route('/api/music-links', musicLinks);
app.route('/api/music-links', events);

const port = Number(process.env.PORT) || 3001;
serve({ fetch: app.fetch, port }, () => {
	console.log(`Backend running on http://localhost:${port}`);
});

export default app;
