# Pulse

Client-side mood, activity, and health correlation tracker. Log flexible multi-times-daily check-ins for mood, exercise, physical well-being, and energy — then explore trends on an interactive timeline.

Data is always cached in `localStorage`. When Supabase credentials are provided (via Doppler or `.env`), check-ins and settings also sync to Supabase using anonymous auth + RLS.

## Features

- **Multiple daily check-ins** — log as often as you like
- **Configurable categories** — add, remove, reorder, and recolor; each can optionally use a 1–10 bubble scale
- **Custom activities** per category — add them on the check-in card or in Settings
- **Trends chart** — category rating lines plus one activity at a time as dots on the Mood line
- **Activity frequency chart** — bar chart of how often an activity happens, grouped by hour of day, day of week, or date
- **Confetti** — celebrates every saved check-in
- **Whole-check-in notes** — one notes field per entry
- **Full CRUD** — edit or delete past check-ins
- **LocalStorage cache** — works offline; older data migrates automatically
- **Optional Supabase sync** — when `SUPABASE_URL` + `SUPABASE_ANON` (or `VITE_*` variants) are set

## Live site

**https://kirk-creator.github.io/Mood/** (redirects to the built app)

Direct build URL: **https://kirk-creator.github.io/Mood/docs/**

## Secrets (Doppler → GitHub `github-pages` environment)

Doppler sync for this repo is:

`Actions: Kirk-creator / Mood / github-pages / variable syncing`

with names:

| Name | Purpose |
| --- | --- |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon/public key |

The deploy workflow uses `environment: github-pages` and reads those from environment secrets **and** variables, then bakes them into the static Pages build.

### One-time Supabase setup

1. **Enable the Data API** — Project Settings → Data API (or Integrations → Data API). Turn it **on** and keep `public` in the exposed schemas. If PostgREST logs say `pg_pgrst_no_exposed_schemas`, the Data API is disabled.
2. Run `supabase/migrations/001_pulse.sql` in the Supabase SQL editor.
3. Enable **Authentication → Providers → Anonymous** sign-ins.
4. Keep `SUPABASE_URL` + `SUPABASE_ANON_KEY` in Doppler (already synced to `github-pages`).
5. After deploy succeeds, open the live site once — it uploads existing `localStorage` check-ins into Supabase.

Trends/History still render from the local cache; Supabase is the cloud copy in the Table Editor.

### Develop with Doppler CLI (optional)

```bash
npm install
doppler setup
npm run dev:doppler
```

Without the CLI, copy `.env.example` → `.env.local` and run `npm run dev`.

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

With Doppler:

```bash
npm run build:doppler
```

Production files are written to `docs/` (committed for GitHub Pages). Asset paths use a relative Vite `base`.

## GitHub Pages setup

This repo’s Pages source is **Deploy from a branch → `main` → `/ (root)`**. The root `index.html` redirects GitHub Pages visitors to `/docs/` (the production build).

For a cleaner URL without `/docs`, switch **Settings → Pages → Source** to **GitHub Actions**, or set the branch folder to **`/docs`**.

Pushes to `main` rebuild `docs/` via `.github/workflows/deploy.yml` using the `github-pages` environment (where Doppler syncs `SUPABASE_URL` + `SUPABASE_ANON_KEY`).

If deploy fails on missing credentials, run **Actions → Inspect Actions secrets** (defaults to the `github-pages` environment) to confirm the key names GitHub can see.
