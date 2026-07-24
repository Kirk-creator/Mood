import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base keeps asset paths correct for GitHub Pages project sites
// whether served from /Mood/ (Actions) or /Mood/docs/ (branch deploy).
const base = process.env.VITE_BASE_PATH ?? './'

export default defineConfig({
  plugins: [react()],
  base,
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
})
