// Soundcharts is mocked — see README for rationale.
// Interface mirrors what a real integration would return so swapping is trivial.

export interface PlatformLinks {
  spotify_url: string | null
  apple_music_url: string | null
  deezer_url: string | null
  youtube_url: string | null
  soundcloud_url: string | null
}

const MOCK_PLATFORM_LINKS: PlatformLinks[] = [
  {
    spotify_url: null,
    apple_music_url: 'https://music.apple.com/us/album/mock-track/123456789',
    deezer_url: 'https://www.deezer.com/track/123456789',
    youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    soundcloud_url: 'https://soundcloud.com/mock-artist/mock-track',
  },
  {
    spotify_url: null,
    apple_music_url: 'https://music.apple.com/us/album/mock-track-b/987654321',
    deezer_url: 'https://www.deezer.com/track/987654321',
    youtube_url: null,
    soundcloud_url: 'https://soundcloud.com/mock-artist/mock-track-b',
  },
]

export async function getPlatformLinks(_spotifyTrackId: string): Promise<PlatformLinks> {
  // In production: call Soundcharts API with spotifyTrackId to get cross-platform links
  const mock = MOCK_PLATFORM_LINKS[Math.floor(Math.random() * MOCK_PLATFORM_LINKS.length)]
  return Promise.resolve(mock)
}
