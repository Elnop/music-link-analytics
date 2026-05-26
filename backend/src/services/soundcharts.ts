const BASE_URL = 'https://customer.api.soundcharts.com'

export interface PlatformLinks {
  spotify_url: string | null
  apple_music_url: string | null
  deezer_url: string | null
  youtube_url: string | null
  soundcloud_url: string | null
}

const NULL_LINKS: PlatformLinks = {
  spotify_url: null,
  apple_music_url: null,
  deezer_url: null,
  youtube_url: null,
  soundcloud_url: null,
}

function getHeaders(): Record<string, string> {
  return {
    'x-app-id': process.env.SOUNDCHARTS_APP_ID ?? '',
    'x-api-key': process.env.SOUNDCHARTS_API_KEY ?? '',
  }
}

async function getSoundchartsUuid(spotifyTrackId: string): Promise<string | null> {
  const res = await fetch(
    `${BASE_URL}/api/v2/song/by-platform/spotify/${spotifyTrackId}`,
    { headers: getHeaders() },
  )
  if (!res.ok) return null
  const data = await res.json() as { type: string; object: { uuid: string }; errors: unknown[] }
  if (data.errors?.length || !data.object?.uuid) return null
  return data.object.uuid
}

async function getUrlForPlatform(uuid: string, platform: string): Promise<string | null> {
  const res = await fetch(
    `${BASE_URL}/api/v2/song/${uuid}/identifiers?platform=${platform}&limit=5`,
    { headers: getHeaders() },
  )
  if (!res.ok) return null
  const data = await res.json() as { items: { platformCode: string; url: string }[]; errors: unknown[] }
  if (data.errors?.length) return null
  return data.items?.find((i) => i.url)?.url ?? null
}

export async function getPlatformLinks(spotifyTrackId: string): Promise<PlatformLinks> {
  const uuid = await getSoundchartsUuid(spotifyTrackId)
  if (!uuid) return NULL_LINKS

  const [spotify_url, apple_music_url, deezer_url, youtube_url, soundcloud_url] =
    await Promise.all([
      getUrlForPlatform(uuid, 'spotify'),
      getUrlForPlatform(uuid, 'apple-music'),
      getUrlForPlatform(uuid, 'deezer'),
      getUrlForPlatform(uuid, 'youtube'),
      getUrlForPlatform(uuid, 'soundcloud'),
    ])

  return { spotify_url, apple_music_url, deezer_url, youtube_url, soundcloud_url }
}
