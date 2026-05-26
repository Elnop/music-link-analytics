# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install all dependencies (root + frontend + backend)
npm run install:all

# Start both servers concurrently
npm run dev

# Start individually
npm run dev --prefix backend   # tsx watch src/index.ts → http://localhost:3001
npm run dev --prefix frontend  # vite → http://localhost:5173

# Seed the database with sample data
npm run seed

# Format all files
npm run format

# Check formatting without writing
npm run format:check

# Lint frontend only
npm run lint --prefix frontend

# Build backend (tsc + rebuild better-sqlite3)
npm run build --prefix backend
```

There are no automated tests in this project.

## Environment

Copy `backend/.env.example` to `backend/.env` and fill in Spotify credentials. Soundcharts sandbox credentials (`soundcharts/soundcharts`) are pre-filled and only cover Billie Eilish and Tones & I tracks.

Required env vars: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`. Optional: `SOUNDCHARTS_APP_ID`, `SOUNDCHARTS_API_KEY`, `DATABASE_URL` (default `./data/musiclink.db`), `PORT` (default `3001`), `FRONTEND_URL` (default `http://localhost:5173`).

## Architecture

The project is a monorepo with a root `package.json` that only coordinates scripts via `concurrently`. Backend and frontend each have their own `package.json`.

**Backend** (`backend/src/`):

- `index.ts` — entry point: runs migrations, seeds if empty, mounts Hono routes
- `db/client.ts` — Kysely + better-sqlite3 instance; `db/schema.ts` — TypeScript table interfaces; `db/migrate.ts` — `createTable ifNotExists` migrations (no migration files, just imperative Kysely calls)
- `services/spotify.ts` — Client Credentials OAuth with in-memory token cache (refreshes 60s before expiry). Exports `searchTracks` and `getTrack`
- `services/soundcharts.ts` — two-step: fetch Soundcharts UUID from Spotify track ID, then fetch per-platform URLs in parallel
- `routes/musicLinks.ts`, `routes/events.ts`, `routes/search.ts` — Hono route handlers

**Frontend** (`frontend/src/`):

- `api/` — typed fetch helpers that hit `/api/*` (proxied by Vite to `localhost:3001`)
- `pages/` — four pages: `HomePage` (list all), `CreatePage` (search Spotify + create), `PublicPage` (`/music-link/:id`), `ReportPage` (`/music-link/:id/report` with Recharts)
- `types/index.ts` — shared TypeScript interfaces (`MusicLink`, `SpotifyTrackResult`, `PlatformLinks`, `AnalyticsReport`)
- Mantine v9 for UI components, React Router v7 for routing

**Key data flow**: The DB only stores `spotify_track_id` + platform URLs. Track metadata (name, artist, cover) is fetched from Spotify on every request — it is not persisted. The `/:id/report` route must be registered before `/:id` in Hono to avoid route conflict.

**SQLite constraint**: `spotify_track_id` has a `UNIQUE` constraint — only one MusicLink per Spotify track.
