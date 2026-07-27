/**
 * Resolve Supabase public credentials from Vite-injected env.
 *
 * Doppler secret names supported (via vite.config.ts mapping):
 * - SUPABASE_URL / VITE_SUPABASE_URL
 * - SUPABASE_ANON / SUPABASE_ANON_KEY / VITE_SUPABASE_ANON / VITE_SUPABASE_ANON_KEY
 */
export function getSupabaseConfig(): { url: string; anonKey: string } | null {
  const url = (import.meta.env.VITE_SUPABASE_URL ?? '').trim()
  const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim()
  if (!url || !anonKey) return null
  return { url, anonKey }
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig() !== null
}
