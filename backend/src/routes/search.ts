import { Hono } from 'hono'
import { searchTracks } from '../services/spotify.js'
import { getPlatformLinks } from '../services/soundcharts.js'

const search = new Hono()

search.get('/spotify', async (c) => {
  const query = c.req.query('query')
  if (!query) return c.json({ error: 'query param required' }, 400)

  try {
    const tracks = await searchTracks(query)
    return c.json(tracks.map((t) => ({
      id: t.id,
      name: t.name,
      artist: t.artists[0]?.name ?? 'Unknown',
      coverUrl: t.album.images[0]?.url ?? null,
      spotifyUrl: t.external_urls.spotify,
      durationMs: t.duration_ms,
    })))
  } catch (err) {
    console.error(err)
    return c.json({ error: 'Spotify search failed' }, 502)
  }
})

search.get('/:spotifyTrackId/similar', async (c) => {
  const { spotifyTrackId } = c.req.param()
  try {
    const links = await getPlatformLinks(spotifyTrackId)
    return c.json(links)
  } catch (err) {
    console.error(err)
    return c.json({ error: 'Could not fetch platform links' }, 502)
  }
})

export { search }
