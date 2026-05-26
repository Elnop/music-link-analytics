import { Hono } from 'hono';
import { nanoid } from 'nanoid';
import { kysely } from '../db/client.js';

const VALID_EVENT_TYPES = ['page_view', 'platform_click'] as const;
const MAX_PLATFORM_LENGTH = 64;

const events = new Hono();

events.post('/:id/events', async (c) => {
	const { id } = c.req.param();

	let body: { event_type: string; platform?: string };
	try {
		body = await c.req.json();
	} catch {
		return c.json({ error: 'Request body must be valid JSON' }, 400);
	}

	if (!VALID_EVENT_TYPES.includes(body.event_type as (typeof VALID_EVENT_TYPES)[number])) {
		return c.json({ error: `event_type must be one of: ${VALID_EVENT_TYPES.join(', ')}` }, 400);
	}

	if (body.platform && body.platform.length > MAX_PLATFORM_LENGTH) {
		return c.json({ error: `platform must be ${MAX_PLATFORM_LENGTH} characters or fewer` }, 400);
	}

	const link = await kysely
		.selectFrom('music_links')
		.select('id')
		.where('id', '=', id)
		.executeTakeFirst();
	if (!link) return c.json({ error: 'MusicLink not found' }, 404);

	await kysely
		.insertInto('music_link_events')
		.values({
			id: nanoid(10),
			music_link_id: id,
			event_type: body.event_type as 'page_view' | 'platform_click',
			platform: body.platform ?? null,
			created_at: new Date().toISOString(),
		})
		.execute();

	return c.json({ ok: true }, 201);
});

export { events };
