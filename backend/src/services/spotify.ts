interface TokenCache {
	accessToken: string;
	expiresAt: number;
}

interface SpotifyTrack {
	id: string;
	name: string;
	artists: { name: string }[];
	album: { images: { url: string }[] };
	external_urls: { spotify: string };
	duration_ms: number;
}

interface SpotifySearchResponse {
	tracks: { items: SpotifyTrack[] };
}

let tokenCache: TokenCache | null = null;

async function getAccessToken(): Promise<string> {
	if (tokenCache && Date.now() < tokenCache.expiresAt) {
		return tokenCache.accessToken;
	}

	const clientId = process.env.SPOTIFY_CLIENT_ID;
	const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
	if (!clientId || !clientSecret) {
		throw new Error('Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET');
	}

	const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
	const res = await fetch('https://accounts.spotify.com/api/token', {
		method: 'POST',
		headers: {
			Authorization: `Basic ${credentials}`,
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: 'grant_type=client_credentials',
	});

	if (!res.ok) throw new Error(`Spotify token error: ${res.status}`);

	const data = (await res.json()) as { access_token: string; expires_in: number };
	tokenCache = {
		accessToken: data.access_token,
		expiresAt: Date.now() + (data.expires_in - 60) * 1000,
	};

	return tokenCache.accessToken;
}

export async function searchTracks(query: string): Promise<SpotifyTrack[]> {
	const token = await getAccessToken();
	const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`;
	const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
	if (!res.ok) throw new Error(`Spotify search error: ${res.status}`);
	const data = (await res.json()) as SpotifySearchResponse;
	return data.tracks.items;
}

export async function getTrack(trackId: string): Promise<SpotifyTrack> {
	const token = await getAccessToken();
	const res = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
		headers: { Authorization: `Bearer ${token}` },
	});
	if (!res.ok) throw new Error(`Spotify getTrack error: ${res.status}`);
	return res.json() as Promise<SpotifyTrack>;
}

export type { SpotifyTrack };
