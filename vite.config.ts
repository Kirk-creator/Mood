import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Map Doppler / process env names onto Vite's VITE_ client vars.
 * Supports the names commonly stored in Doppler for this project:
 * SUPABASE_URL + SUPABASE_ANON (and VITE_ / _KEY variants).
 */
function resolveSupabaseEnv(mode: string): {
  url: string
  anonKey: string
} {
  const env = loadEnv(mode, process.cwd(), '')
  const url =
    env.VITE_SUPABASE_URL ||
    env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ''
  const anonKey =
    env.VITE_SUPABASE_ANON_KEY ||
    env.VITE_SUPABASE_ANON ||
    env.SUPABASE_ANON_KEY ||
    env.SUPABASE_ANON ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON ||
    ''
  return { url, anonKey }
}

// Relative base keeps asset paths correct for GitHub Pages project sites
// whether served from /Mood/ (Actions) or /Mood/docs/ (branch deploy).
const base = process.env.VITE_BASE_PATH ?? './'

export default defineConfig(({ mode }) => {
  const { url, anonKey } = resolveSupabaseEnv(mode)

  return {
    plugins: [react()],
    base,
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(url),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(anonKey),
    },
    build: {
      outDir: 'docs',
      emptyOutDir: true,
    },
  }
})
