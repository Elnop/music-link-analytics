import { Hono } from 'hono';
import { nanoid } from 'nanoid';
import { sql } from 'kysely';
import { kysely } from '../db/client.js';
import { getTrack } from '../services/spotify.js';

const URL_FIELDS = [
	'spotify_url',
	'apple_music_url',
	'deezer_url',
	'youtube_url',
	'soundcloud_url',
] as const;

function isSafeUrl(value: unknown): boolean {
	if (value === null || value === undefined) return true;
	if (typeof value !== 'string') return false;
	try {
		const { protocol } = new URL(value);
		return protocol === 'https:' || protocol === 'http:';
	} catch {
		return false;
	}
}

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
	let body: {
		spotify_track_id: string;
		spotify_url: string | null;
		apple_music_url: string | null;
		deezer_url: string | null;
		youtube_url: string | null;
		soundcloud_url: string | null;
	};
	try {
		body = await c.req.json();
	} catch {
		return c.json({ error: 'Request body must be valid JSON' }, 400);
	}

	if (!body.spotify_track_id) return c.json({ error: 'spotify_track_id is required' }, 400);

	for (const field of URL_FIELDS) {
		if (!isSafeUrl(body[field])) {
			return c.json({ error: `${field} must be a valid http/https URL or null` }, 400);
		}
	}

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
			return c.json(
				{ error: 'A music link for this track already exists.', id: existing?.id },
				409,
			);
		}
		throw err;
	}

	let trackMeta = { name: 'Unknown', artist: 'Unknown', coverUrl: '' };
	try {
		const track = await getTrack(record.spotify_track_id);
		trackMeta = {
			name: track.name,
			artist: track.artists[0]?.name ?? 'Unknown',
			coverUrl: track.album.images[0]?.url ?? '',
		};
	} catch (err) {
		console.error(`[Spotify] failed to fetch track ${record.spotify_track_id}:`, err);
	}

	return c.json({ ...record, ...trackMeta, views: 0, clicks: 0 }, 201);
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

	const [{ totalViews }] = await kysely
		.selectFrom('music_link_events')
		.select(kysely.fn.count<number>('id').as('totalViews'))
		.where('music_link_id', '=', id)
		.where('event_type', '=', 'page_view')
		.execute();

	const [{ totalClicks }] = await kysely
		.selectFrom('music_link_events')
		.select(kysely.fn.count<number>('id').as('totalClicks'))
		.where('music_link_id', '=', id)
		.where('event_type', '=', 'platform_click')
		.execute();

	const clicksByPlatformRows = await kysely
		.selectFrom('music_link_events')
		.select(['platform', kysely.fn.count<number>('id').as('cnt')])
		.where('music_link_id', '=', id)
		.where('event_type', '=', 'platform_click')
		.where('platform', 'is not', null)
		.groupBy('platform')
		.execute();

	const viewsByDayRows = await kysely
		.selectFrom('music_link_events')
		.select([
			sql<string>`substr(created_at, 1, 10)`.as('day'),
			kysely.fn.count<number>('id').as('cnt'),
		])
		.where('music_link_id', '=', id)
		.where('event_type', '=', 'page_view')
		.groupBy(sql`substr(created_at, 1, 10)`)
		.orderBy(sql`substr(created_at, 1, 10)`, 'asc')
		.execute();

	const clicksByDayRows = await kysely
		.selectFrom('music_link_events')
		.select([
			sql<string>`substr(created_at, 1, 10)`.as('day'),
			kysely.fn.count<number>('id').as('cnt'),
		])
		.where('music_link_id', '=', id)
		.where('event_type', '=', 'platform_click')
		.groupBy(sql`substr(created_at, 1, 10)`)
		.orderBy(sql`substr(created_at, 1, 10)`, 'asc')
		.execute();

	const views = Number(totalViews);
	const clicks = Number(totalClicks);
	const clickRate = views > 0 ? Math.round((clicks / views) * 10000) / 100 : 0;

	const clicksByPlatform: Record<string, number> = {};
	for (const row of clicksByPlatformRows) {
		if (row.platform) clicksByPlatform[row.platform] = Number(row.cnt);
	}

	const viewsByDay: Record<string, number> = {};
	for (const row of viewsByDayRows) {
		viewsByDay[row.day] = Number(row.cnt);
	}

	const clicksByDay: Record<string, number> = {};
	for (const row of clicksByDayRows) {
		clicksByDay[row.day] = Number(row.cnt);
	}

	return c.json({
		totalViews: views,
		totalClicks: clicks,
		clickRate,
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
