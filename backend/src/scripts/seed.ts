import 'dotenv/config';
import { mkdirSync } from 'node:fs';
import { getTrack } from '../services/spotify.js';
import { getPlatformLinks } from '../services/soundcharts.js';
import { kysely } from '../db/client.js';
import { runMigrations } from '../db/migrate.js';
import { nanoid } from 'nanoid';

// Tracks covered by the Soundcharts sandbox (Billie Eilish & Tones and I)
const SEED_TRACK_IDS = [
	'2Fxmhks0bxGSBdJ92vM42m', // Billie Eilish — bad guy
	'4SSnFejRGlZikf02HLewEF', // Billie Eilish — bury a friend
	'2N8m6CYs74qQO4mjVcXO30', // Tones and I — Dance Monkey
];

async function seedTracks() {
	for (const trackId of SEED_TRACK_IDS) {
		const track = await getTrack(trackId).catch((err: Error) => {
			console.warn(`[seed] could not fetch ${trackId}: ${err.message}`);
			return null;
		});
		if (!track) continue;

		const existing = await kysely
			.selectFrom('music_links')
			.select('id')
			.where('spotify_track_id', '=', track.id)
			.executeTakeFirst();

		if (existing) {
			console.log(`[seed] already exists: ${track.name} by ${track.artists[0]?.name} — skipping`);
			continue;
		}

		const platformLinks = await getPlatformLinks(track.id);
		const now = new Date().toISOString();

		await kysely
			.insertInto('music_links')
			.values({
				id: nanoid(10),
				spotify_track_id: track.id,
				spotify_url: track.external_urls.spotify,
				apple_music_url: platformLinks.apple_music_url,
				deezer_url: platformLinks.deezer_url,
				youtube_url: platformLinks.youtube_url,
				soundcloud_url: platformLinks.soundcloud_url,
				created_at: now,
				updated_at: now,
			})
			.execute();

		console.log(`[seed] created: ${track.name} by ${track.artists[0]?.name} (${track.id})`);
	}
}

export async function seedIfEmpty() {
	const count = await kysely
		.selectFrom('music_links')
		.select(kysely.fn.countAll<number>().as('count'))
		.executeTakeFirstOrThrow();

	if (Number(count.count) > 0) return;

	console.log('[seed] DB empty, seeding...');
	await seedTracks();
	console.log('[seed] done');
}

// Run standalone when invoked directly via `npm run seed`
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
	mkdirSync('./data', { recursive: true });
	await runMigrations();
	await seedTracks();
	await kysely.destroy();
	console.log('[seed] done');
}
