# Pulse

Client-side mood, activity, and health correlation tracker. Log flexible multi-times-daily check-ins for mood, exercise, physical well-being, and energy — then explore trends on an interactive timeline. All data stays in your browser via `localStorage`.

## Features

- **Multiple daily check-ins** — log as often as you like
- **Configurable categories** — add, remove, reorder, and recolor; each can optionally use a 1–10 bubble scale
- **Custom activities** per category — add them on the check-in card or in Settings
- **Trends chart** — category rating lines plus one activity at a time as dots on the Mood line
- **Confetti** — celebrates every saved check-in
- **Whole-check-in notes** — one notes field per entry
- **Full CRUD** — edit or delete past check-ins
- **LocalStorage persistence** — nothing is uploaded; older data migrates automatically

## Live site

**https://kirk-creator.github.io/Mood/** (redirects to the built app)

Direct build URL: **https://kirk-creator.github.io/Mood/docs/**

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

Production files are written to `docs/` (committed for GitHub Pages). Asset paths use a relative Vite `base`.

## GitHub Pages setup

This repo’s Pages source is **Deploy from a branch → `main` → `/ (root)`**. The root `index.html` redirects GitHub Pages visitors to `/docs/` (the production build).

For a cleaner URL without `/docs`, switch **Settings → Pages → Source** to **GitHub Actions**, or set the branch folder to **`/docs`**.

Pushes to `main` rebuild `docs/` via `.github/workflows/deploy.yml`.
