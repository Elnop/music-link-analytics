import { Hono } from 'hono'
import { nanoid } from 'nanoid'
import { kysely } from '../db/client.js'
import { getTrack } from '../services/spotify.js'

const musicLinks = new Hono()

// GET /api/music-links — list with aggregated stats
musicLinks.get('/', async (c) => {
  const links = await kysely.selectFrom('music_links').selectAll().orderBy('created_at', 'desc').execute()

  const withStats = await Promise.all(
    links.map(async (link) => {
      const [{ views }] = await kysely
        .selectFrom('music_link_events')
        .select(kysely.fn.count<number>('id').as('views'))
        .where('music_link_id', '=', link.id)
        .where('event_type', '=', 'page_view')
        .execute()

      const [{ clicks }] = await kysely
        .selectFrom('music_link_events')
        .select(kysely.fn.count<number>('id').as('clicks'))
        .where('music_link_id', '=', link.id)
        .where('event_type', '=', 'platform_click')
        .execute()

      let trackMeta: { name: string; artist: string; coverUrl: string } | null = null
      try {
        const track = await getTrack(link.spotify_track_id)
        trackMeta = {
          name: track.name,
          artist: track.artists[0]?.name ?? 'Unknown',
          coverUrl: track.album.images[0]?.url ?? '',
        }
      } catch {
        trackMeta = { name: 'Unknown', artist: 'Unknown', coverUrl: '' }
      }

      return { ...link, ...trackMeta, views: Number(views), clicks: Number(clicks) }
    })
  )

  return c.json(withStats)
})

// POST /api/music-links — create
musicLinks.post('/', async (c) => {
  const body = await c.req.json<{
    spotify_track_id: string
    spotify_url: string | null
    apple_music_url: string | null
    deezer_url: string | null
    youtube_url: string | null
    soundcloud_url: string | null
  }>()

  const now = new Date().toISOString()
  const id = nanoid(10)

  await kysely.insertInto('music_links').values({
    id,
    spotify_track_id: body.spotify_track_id,
    spotify_url: body.spotify_url ?? null,
    apple_music_url: body.apple_music_url ?? null,
    deezer_url: body.deezer_url ?? null,
    youtube_url: body.youtube_url ?? null,
    soundcloud_url: body.soundcloud_url ?? null,
    created_at: now,
    updated_at: now,
  }).execute()

  const created = await kysely.selectFrom('music_links').selectAll().where('id', '=', id).executeTakeFirstOrThrow()
  return c.json(created, 201)
})

// GET /api/music-links/:id
musicLinks.get('/:id', async (c) => {
  const { id } = c.req.param()
  const link = await kysely.selectFrom('music_links').selectAll().where('id', '=', id).executeTakeFirst()
  if (!link) return c.json({ error: 'Not found' }, 404)

  let trackMeta: { name: string; artist: string; coverUrl: string } = { name: 'Unknown', artist: 'Unknown', coverUrl: '' }
  try {
    const track = await getTrack(link.spotify_track_id)
    trackMeta = {
      name: track.name,
      artist: track.artists[0]?.name ?? 'Unknown',
      coverUrl: track.album.images[0]?.url ?? '',
    }
  } catch { /* fallback already set */ }

  return c.json({ ...link, ...trackMeta })
})

export { musicLinks }
