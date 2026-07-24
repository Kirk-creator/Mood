# Pulse

Client-side mood, activity, and health correlation tracker. Log flexible multi-times-daily check-ins for mood, exercise, physical well-being, and energy — then explore trends on an interactive timeline. All data stays in your browser via `localStorage`.

## Features

- **Multiple daily check-ins** — log as often as you like
- **1–10 scales** with slider + number input per category
- **Skip any category** and add optional notes
- **Interactive line chart** with category toggles and date-range filters (7 / 30 / 90 days, all time, or custom)
- **Full CRUD** — edit or delete past check-ins
- **LocalStorage persistence** — no backend required

## Categories

| Category | Scale |
|---|---|
| Mood | 1–10 |
| Physical Exercise | 1–10 |
| Physical Well-being | 1–10 |
| Energy Level | 1–10 |

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

The Vite `base` path defaults to `/Mood/` for GitHub Pages (`https://<user>.github.io/Mood/`). For local root hosting or a custom domain:

```bash
VITE_BASE_PATH=/ npm run build
```

## Deploy (GitHub Pages)

1. In the repo **Settings → Pages**, set **Source** to **GitHub Actions**.
2. Push to `main` (or run the **Deploy to GitHub Pages** workflow manually).
3. The workflow in `.github/workflows/deploy.yml` builds the SPA and publishes the `dist` folder.

No server or API keys are required — the app is a static SPA.
