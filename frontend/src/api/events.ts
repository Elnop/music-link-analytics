import { apiFetch } from './client'

export const eventsApi = {
  trackView: (musicLinkId: string) =>
    apiFetch<{ ok: boolean }>(`/music-links/${musicLinkId}/events`, {
      method: 'POST',
      body: JSON.stringify({ event_type: 'page_view' }),
    }),
  trackClick: (musicLinkId: string, platform: string) =>
    apiFetch<{ ok: boolean }>(`/music-links/${musicLinkId}/events`, {
      method: 'POST',
      body: JSON.stringify({ event_type: 'platform_click', platform }),
    }),
}
