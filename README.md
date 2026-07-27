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

## Secrets (Doppler)

This project expects Supabase public credentials from Doppler (or a local `.env`):

| Doppler / env name | Also accepted |
| --- | --- |
| `SUPABASE_URL` | `VITE_SUPABASE_URL` |
| `SUPABASE_ANON` | `SUPABASE_ANON_KEY`, `VITE_SUPABASE_ANON`, `VITE_SUPABASE_ANON_KEY` |

`vite.config.ts` maps those names onto `import.meta.env.VITE_SUPABASE_*` for the client bundle.

### One-time Supabase setup

1. Run `supabase/migrations/001_pulse.sql` in the Supabase SQL editor.
2. Enable **Authentication → Providers → Anonymous** sign-ins.
3. Store the project URL and anon key in Doppler (names above).

### Develop with Doppler

```bash
npm install
# link the Doppler project once
doppler setup
npm run dev:doppler
```

Without Doppler, copy `.env.example` → `.env.local` and run `npm run dev`.

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

Pushes to `main` rebuild `docs/` via `.github/workflows/deploy.yml`.

To bake Supabase credentials into the Pages build, add a GitHub Actions secret `DOPPLER_TOKEN` (Doppler service token). The workflow runs `doppler run -- npm run build` when that token is present.
