import { kysely } from './client.js';

export async function runMigrations() {
	await kysely.schema
		.createTable('music_links')
		.ifNotExists()
		.addColumn('id', 'text', (col) => col.primaryKey().notNull())
		.addColumn('spotify_track_id', 'text', (col) => col.notNull().unique())
		.addColumn('spotify_url', 'text')
		.addColumn('apple_music_url', 'text')
		.addColumn('deezer_url', 'text')
		.addColumn('youtube_url', 'text')
		.addColumn('soundcloud_url', 'text')
		.addColumn('created_at', 'text', (col) => col.notNull())
		.addColumn('updated_at', 'text', (col) => col.notNull())
		.execute();

	await kysely.schema
		.createTable('music_link_events')
		.ifNotExists()
		.addColumn('id', 'text', (col) => col.primaryKey().notNull())
		.addColumn('music_link_id', 'text', (col) => col.notNull().references('music_links.id'))
		.addColumn('event_type', 'text', (col) => col.notNull())
		.addColumn('platform', 'text')
		.addColumn('created_at', 'text', (col) => col.notNull())
		.execute();

	console.log('Migrations complete');
}
