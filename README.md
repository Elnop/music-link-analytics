# MusicLink Analytics

A full-stack mini-application to create shareable music pages and track analytics.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vite + React 19 + TypeScript + Mantine UI v9 + React Router v7 + RechartJS |
| Backend | Node.js + TypeScript + Hono + Kysely + SQLite (better-sqlite3) |
| APIs | Spotify Web API (Client Credentials) + Soundcharts (mocked) |

## Quick start

```bash
# 1. Clone the repo and install dependencies
npm run install:all

# 2. Configure environment variables
cp backend/.env.example backend/.env
# Edit backend/.env and fill in your Spotify credentials:
# SPOTIFY_CLIENT_ID=...
# SPOTIFY_CLIENT_SECRET=...

# 3. Start both servers
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

> **Note:** You need a Spotify app to get credentials. Create one at https://developer.spotify.com/dashboard — set any Redirect URI (not used here, we use Client Credentials flow).

## Architecture

```
music-link-analytics/
├── frontend/                # Vite SPA
│   └── src/
│       ├── api/             # Typed fetch helpers (musicLinks, search, events)
│       ├── pages/           # HomePage, CreatePage, PublicPage, ReportPage
│       └── types/           # Shared TypeScript interfaces
└── backend/                 # Hono REST API
    └── src/
        ├── db/              # Kysely schema, client, migrations
        ├── routes/          # musicLinks, events, search
        └── services/        # spotify (real), soundcharts (mocked)
```

The Vite dev server proxies `/api` requests to the backend on port 3001, so Spotify credentials are never exposed to the browser.

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/music-links | List all MusicLinks with aggregated stats |
| POST | /api/music-links | Create a new MusicLink |
| GET | /api/music-links/:id | Get a MusicLink (with Spotify metadata) |
| GET | /api/music-links/:id/report | Analytics report |
| POST | /api/music-links/:id/events | Track a view or click |
| GET | /api/search/spotify?query= | Search Spotify tracks |
| GET | /api/tracks/:id/similar | Get platform links (Soundcharts) |

## Technical choices

**Hono** over Express: lighter, fully typed, native async/await. Feels closer to the web standard fetch API.

**Client Credentials OAuth** for Spotify: no user login required. Token is cached in memory with automatic refresh (60s pre-expiry buffer). Never sent to the frontend.

**SQLite only stores `spotify_track_id` + platform URLs**: track metadata (title, artist, cover) is fetched from Spotify on demand. This avoids data duplication but creates a dependency on Spotify for display — see Potential improvements.

**Soundcharts mocked**: The Soundcharts sandbox requires an approval process. The mock (`backend/src/services/soundcharts.ts`) implements the same interface a real integration would use — swapping in the real API only requires changing that one file.

**tsx** for TypeScript execution: uses `tsx watch` instead of `node --experimental-strip-types` because Node's experimental flag does not remap `.js` imports to `.ts` files, which is required for NodeNext ESM resolution.

## Limitations

- Soundcharts integration is mocked (platform links are realistic but not real)
- No pagination on the MusicLinks list
- The UNIQUE constraint on `spotify_track_id` prevents creating two MusicLinks for the same Spotify track
- Track metadata (title, artist, cover) requires a live Spotify API connection — if Spotify is unavailable, it falls back to "Unknown"

## Potential improvements

- **Denormalize track metadata** (title, artist, cover) into the `music_links` table at creation time — eliminates the Spotify dependency on the public page critical path and enables batch queries
- **Batch Spotify metadata** on the list page using `/tracks?ids=...` (up to 50 tracks per request) to reduce N+1 API calls
- **Real Soundcharts integration** once sandbox access is approved
- **Pagination** for the MusicLinks list
- **Error boundary** in the React app for graceful degradation
