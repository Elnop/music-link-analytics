import { apiFetch } from './client';
import type { SpotifySearchResult, PlatformLinks } from '../types';

export const searchApi = {
	spotify: (query: string, offset = 0) =>
		apiFetch<SpotifySearchResult>(
			`/search/spotify?query=${encodeURIComponent(query)}&offset=${offset}`,
		),
	similarTracks: (spotifyTrackId: string) =>
		apiFetch<PlatformLinks>(`/tracks/${spotifyTrackId}/similar`),
};
