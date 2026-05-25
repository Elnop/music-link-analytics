import type { Generated } from 'kysely'

export interface MusicLinkTable {
  id: string
  spotify_track_id: string
  spotify_url: string | null
  apple_music_url: string | null
  deezer_url: string | null
  youtube_url: string | null
  soundcloud_url: string | null
  created_at: string
  updated_at: string
}

export interface MusicLinkEventTable {
  id: string
  music_link_id: string
  event_type: 'page_view' | 'platform_click'
  platform: string | null
  created_at: string
}

export interface Database {
  music_links: MusicLinkTable
  music_link_events: MusicLinkEventTable
}
