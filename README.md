# Pulse

Client-side mood, activity, and health correlation tracker. Log flexible multi-times-daily check-ins for mood, exercise, physical well-being, and energy — then explore trends on an interactive timeline. All data stays in your browser via `localStorage`.

## Features

- **Multiple daily check-ins** — log as often as you like
- **12 categories** — Mood, Exercise, Well-being, Energy, Food, Social, Health, Hobbies, Events, Sleep, Weather, Other
- **1–10 scales** with slider + number input; skip any rating; optional notes
- **Custom event buttons** per category (e.g. Health → Sick, Headache) — add, rename, or remove in Settings
- **Reorder categories** and **change colors** in Settings
- **Interactive chart** with category lines, event markers, and date-range filters
- **Full CRUD** — edit or delete past check-ins
- **LocalStorage persistence** — nothing is uploaded; existing check-ins are migrated automatically

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
