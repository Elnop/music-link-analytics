import { apiFetch } from './client';
import type { SpotifyTrackResult, PlatformLinks } from '../types';

export const searchApi = {
	spotify: (query: string) =>
		apiFetch<SpotifyTrackResult[]>(`/search/spotify?query=${encodeURIComponent(query)}`),
	similarTracks: (spotifyTrackId: string) =>
		apiFetch<PlatformLinks>(`/tracks/${spotifyTrackId}/similar`),
};
