export interface MusicLink {
	id: string;
	spotify_track_id: string;
	spotify_url: string | null;
	apple_music_url: string | null;
	deezer_url: string | null;
	youtube_url: string | null;
	soundcloud_url: string | null;
	created_at: string;
	updated_at: string;
	// enriched by backend
	name: string;
	artist: string;
	coverUrl: string;
	views: number;
	clicks: number;
}

export interface SpotifyTrackResult {
	id: string;
	name: string;
	artist: string;
	coverUrl: string | null;
	spotifyUrl: string;
	durationMs: number;
}

export interface SpotifySearchResult {
	results: SpotifyTrackResult[];
	total: number;
	offset: number;
	limit: number;
}

export interface PlatformLinks {
	spotify_url: string | null;
	apple_music_url: string | null;
	deezer_url: string | null;
	youtube_url: string | null;
	soundcloud_url: string | null;
}

export interface AnalyticsReport {
	totalViews: number;
	totalClicks: number;
	clickRate: number;
	clicksByPlatform: Record<string, number>;
	viewsByDay: Record<string, number>;
	clicksByDay: Record<string, number>;
}
