import { Hono } from 'hono';
import { nanoid } from 'nanoid';
import { kysely } from '../db/client.js';
import { getTrack } from '../services/spotify.js';

const musicLinks = new Hono();

// GET /api/music-links — list with aggregated stats
musicLinks.get('/', async (c) => {
	const links = await kysely
		.selectFrom('music_links')
		.selectAll()
		.orderBy('created_at', 'desc')
		.execute();

	const withStats = await Promise.all(
		links.map(async (link) => {
			const [{ views }] = await kysely
				.selectFrom('music_link_events')
				.select(kysely.fn.count<number>('id').as('views'))
				.where('music_link_id', '=', link.id)
				.where('event_type', '=', 'page_view')
				.execute();

			const [{ clicks }] = await kysely
				.selectFrom('music_link_events')
				.select(kysely.fn.count<number>('id').as('clicks'))
				.where('music_link_id', '=', link.id)
				.where('event_type', '=', 'platform_click')
				.execute();

			let trackMeta: { name: string; artist: string; coverUrl: string } | null = null;
			try {
				const track = await getTrack(link.spotify_track_id);
				trackMeta = {
					name: track.name,
					artist: track.artists[0]?.name ?? 'Unknown',
					coverUrl: track.album.images[0]?.url ?? '',
				};
			} catch (err) {
				console.error(`[Spotify] failed to fetch track ${link.spotify_track_id}:`, err);
				trackMeta = { name: 'Unknown', artist: 'Unknown', coverUrl: '' };
			}

			return { ...link, ...trackMeta, views: Number(views), clicks: Number(clicks) };
		}),
	);

	return c.json(withStats);
});

// POST /api/music-links — create
musicLinks.post('/', async (c) => {
	const body = await c.req.json<{
		spotify_track_id: string;
		spotify_url: string | null;
		apple_music_url: string | null;
		deezer_url: string | null;
		youtube_url: string | null;
		soundcloud_url: string | null;
	}>();

	if (!body.spotify_track_id) return c.json({ error: 'spotify_track_id is required' }, 400);

	const now = new Date().toISOString();
	const id = nanoid(10);

	const record = {
		id,
		spotify_track_id: body.spotify_track_id,
		spotify_url: body.spotify_url ?? null,
		apple_music_url: body.apple_music_url ?? null,
		deezer_url: body.deezer_url ?? null,
		youtube_url: body.youtube_url ?? null,
		soundcloud_url: body.soundcloud_url ?? null,
		created_at: now,
		updated_at: now,
	};

	try {
		await kysely.insertInto('music_links').values(record).execute();
	} catch (err: any) {
		if (err?.code === 'SQLITE_CONSTRAINT_UNIQUE') {
			const existing = await kysely
				.selectFrom('music_links')
				.select('id')
				.where('spotify_track_id', '=', body.spotify_track_id)
				.executeTakeFirst();
			return c.json({ error: 'A music link for this track already exists.', id: existing?.id }, 409);
		}
		throw err;
	}
	return c.json(record, 201);
});

// GET /api/music-links/:id/report — analytics report (MUST be before /:id)
musicLinks.get('/:id/report', async (c) => {
	const { id } = c.req.param();
	const link = await kysely
		.selectFrom('music_links')
		.selectAll()
		.where('id', '=', id)
		.executeTakeFirst();
	if (!link) return c.json({ error: 'Not found' }, 404);

	const allEvents = await kysely
		.selectFrom('music_link_events')
		.selectAll()
		.where('music_link_id', '=', id)
		.orderBy('created_at', 'asc')
		.execute();

	const views = allEvents.filter((e) => e.event_type === 'page_view');
	const clicks = allEvents.filter((e) => e.event_type === 'platform_click');

	// clicks per platform
	const clicksByPlatform: Record<string, number> = {};
	for (const e of clicks) {
		if (e.platform) clicksByPlatform[e.platform] = (clicksByPlatform[e.platform] ?? 0) + 1;
	}

	// views per day (YYYY-MM-DD)
	const viewsByDay: Record<string, number> = {};
	for (const e of views) {
		const day = e.created_at.slice(0, 10);
		viewsByDay[day] = (viewsByDay[day] ?? 0) + 1;
	}

	// clicks per day
	const clicksByDay: Record<string, number> = {};
	for (const e of clicks) {
		const day = e.created_at.slice(0, 10);
		clicksByDay[day] = (clicksByDay[day] ?? 0) + 1;
	}

	const totalViews = views.length;
	const totalClicks = clicks.length;
	const clickRate = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;

	return c.json({
		totalViews,
		totalClicks,
		clickRate: Math.round(clickRate * 100) / 100,
		clicksByPlatform,
		viewsByDay,
		clicksByDay,
	});
});

// GET /api/music-links/:id
musicLinks.get('/:id', async (c) => {
	const { id } = c.req.param();
	const link = await kysely
		.selectFrom('music_links')
		.selectAll()
		.where('id', '=', id)
		.executeTakeFirst();
	if (!link) return c.json({ error: 'Not found' }, 404);

	let trackMeta: { name: string; artist: string; coverUrl: string } = {
		name: 'Unknown',
		artist: 'Unknown',
		coverUrl: '',
	};
	try {
		const track = await getTrack(link.spotify_track_id);
		trackMeta = {
			name: track.name,
			artist: track.artists[0]?.name ?? 'Unknown',
			coverUrl: track.album.images[0]?.url ?? '',
		};
	} catch (err) {
		console.error(`[Spotify] failed to fetch track ${link.spotify_track_id}:`, err);
	}

	return c.json({ ...link, ...trackMeta });
});

export { musicLinks };
