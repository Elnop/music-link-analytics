import { Hono } from 'hono';
import { nanoid } from 'nanoid';
import { kysely } from '../db/client.js';

const events = new Hono();

events.post('/:id/events', async (c) => {
	const { id } = c.req.param();
	const body = await c.req.json<{
		event_type: 'page_view' | 'platform_click';
		platform?: string;
	}>();

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
			event_type: body.event_type,
			platform: body.platform ?? null,
			created_at: new Date().toISOString(),
		})
		.execute();

	return c.json({ ok: true }, 201);
});

export { events };
