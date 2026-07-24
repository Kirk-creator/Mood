import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves from /<repo-name>/ — set base accordingly.
// Override with VITE_BASE_PATH for custom domains or local root hosting.
const base = process.env.VITE_BASE_PATH ?? '/Mood/'

export default defineConfig({
  plugins: [react()],
  base,
})
