import { Hono } from 'hono';
import { kysely } from '../db/client.js';
import { getTrack } from '../services/spotify.js';

const CRAWLER_UA_PATTERNS = [
  'twitterbot',
  'facebookexternalhit',
  'linkedinbot',
  'telegrambot',
  'whatsapp',
  'slackbot',
  'discordbot',
  'imessage',
  'googlebot',
  'bingbot',
  'curl',
  'python-requests',
  'go-http-client',
];

function isCrawler(userAgent: string | undefined): boolean {
  if (userAgent) {
    const ua = userAgent.toLowerCase();
    if (CRAWLER_UA_PATTERNS.some((p) => ua.includes(p))) return true;
  }
  return false;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildMetaHtml(params: {
  id: string;
  name: string;
  artist: string;
  coverUrl: string;
  pageUrl: string;
}): string {
  const { id, name, artist, coverUrl, pageUrl } = params;
  const title = escapeHtml(`${name} — ${artist}`);
  const description = escapeHtml(`Listen to ${name} by ${artist} on all platforms.`);
  const image = escapeHtml(coverUrl);
  const url = escapeHtml(pageUrl);
  const redirectUrl = `/music-link/${id}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title} | MusicLink</title>
  <meta name="description" content="${description}">

  <!-- Open Graph -->
  <meta property="og:type" content="music.song">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${url}">
  <meta property="og:site_name" content="MusicLink">
  ${image ? `<meta property="og:image" content="${image}">` : ''}

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  ${image ? `<meta name="twitter:image" content="${image}">` : ''}

  <meta http-equiv="refresh" content="0;url=${redirectUrl}">
</head>
<body>
  <script>window.location.replace(${JSON.stringify(redirectUrl)})</script>
</body>
</html>`;
}

const preview = new Hono();

preview.get('/:id', async (c) => {
  const userAgent = c.req.header('user-agent');

  if (!isCrawler(userAgent)) {
    // Not a crawler — let Vite proxy (dev) or static server (prod) handle it
    return c.body(null, 204);
  }

  const { id } = c.req.param();

  const link = await kysely
    .selectFrom('music_links')
    .select('spotify_track_id')
    .where('id', '=', id)
    .executeTakeFirst();

  if (!link) {
    return c.html(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Not Found | MusicLink</title></head><body></body></html>`,
      404,
    );
  }

  let name = 'Unknown';
  let artist = 'Unknown';
  let coverUrl = '';

  try {
    const track = await getTrack(link.spotify_track_id);
    name = track.name;
    artist = track.artists[0]?.name ?? 'Unknown';
    coverUrl = track.album.images[0]?.url ?? '';
  } catch {
    // Spotify unavailable — serve with fallback metadata
  }

  const host = c.req.header('host') ?? 'localhost:3001';
  const protocol = host.startsWith('localhost') ? 'http' : 'https';
  const pageUrl = `${protocol}://${host}/music-link/${id}`;

  return c.html(buildMetaHtml({ id, name, artist, coverUrl, pageUrl }));
});

export { preview };
