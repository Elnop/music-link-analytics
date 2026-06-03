import { apiFetch } from './client';
import type { MusicLink, MusicLinkListItem, AnalyticsReport, Granularity } from '../types';

export const musicLinksApi = {
	list: () => apiFetch<MusicLinkListItem[]>('/music-links'),
	get: (id: string) => apiFetch<MusicLink>(`/music-links/${id}`),
	create: (payload: {
		spotify_track_id: string;
		spotify_url: string | null;
		apple_music_url: string | null;
		deezer_url: string | null;
		youtube_url: string | null;
		soundcloud_url: string | null;
	}) => apiFetch<MusicLink>('/music-links', { method: 'POST', body: JSON.stringify(payload) }),
	report: (id: string, granularity: Granularity = 'day') =>
		apiFetch<AnalyticsReport>(`/music-links/${id}/report?granularity=${granularity}`),
};
