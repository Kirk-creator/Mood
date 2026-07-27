# Pulse

Client-side mood, activity, and health correlation tracker. Log flexible multi-times-daily check-ins for mood, exercise, physical well-being, and energy — then explore trends on an interactive timeline.

Data is cached in `localStorage` per account. With Supabase configured, users sign up / log in with email and password; their check-ins and settings load from Supabase (RLS by `auth.uid()`).

## Features

- **Email sign up & log in** — each account loads its own Supabase check-ins and settings
- **Multiple daily check-ins** — log as often as you like
- **Configurable categories** — new accounts start with Mood, Energy, Health, and Anxiety (1–10 scales); add more anytime and every enabled scale shows on Trends
- **Custom activities** per category — add them on the check-in card or in Settings
- **Trends chart** — category rating lines plus one activity at a time as dots on the Mood line
- **Activity frequency chart** — bar chart of how often an activity happens, grouped by hour of day, day of week, or date
- **Confetti** — celebrates every saved check-in
- **Whole-check-in notes** — one notes field per entry
- **Full CRUD** — edit or delete past check-ins
- **Per-account local cache** — works offline after the first sync
- **Supabase sync** — when `SUPABASE_URL` + `SUPABASE_ANON_KEY` are set

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

1. **Enable the Data API** — Project Settings → Data API, keep `public` exposed.
2. Run `supabase/migrations/001_pulse.sql` in the SQL editor.
3. Enable **Authentication → Providers → Email** (disable email confirmations while testing if you want instant login after sign-up).
4. Under **Authentication → URL configuration**, set Site URL to your Pages URL (`https://kirk-creator.github.io/Mood/docs/`) and add it to Redirect URLs (needed for email confirmation and password reset links).
5. Keep `SUPABASE_URL` + `SUPABASE_ANON_KEY` in Doppler (synced to `github-pages`).

After deploy, open the live site → **Sign up** or **Log in**. That account’s rows in `check_ins` / `app_settings` are what Trends and History show.

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
