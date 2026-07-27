import type { AppSettings, CheckIn } from '../types'
import {
  loadCheckIns,
  loadSettings,
  normalizeCheckIn,
  normalizeSettings,
  saveCheckIns,
  saveSettings,
} from '../storage'
import { ensureUserId, getSupabase } from './supabase'

function sortCheckIns(checkIns: CheckIn[]): CheckIn[] {
  return [...checkIns].sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )
}

function mergeCheckIns(local: CheckIn[], remote: CheckIn[]): CheckIn[] {
  const byId = new Map<string, CheckIn>()
  for (const item of local) byId.set(item.id, item)
  for (const item of remote) {
    const existing = byId.get(item.id)
    if (!existing) {
      byId.set(item.id, item)
      continue
    }
    // Prefer the copy with the later check-in timestamp when both exist.
    const existingTs = new Date(existing.timestamp).getTime()
    const remoteTs = new Date(item.timestamp).getTime()
    byId.set(item.id, remoteTs >= existingTs ? item : existing)
  }
  return sortCheckIns([...byId.values()])
}

export async function hydrateCheckIns(): Promise<CheckIn[]> {
  const local = loadCheckIns()
  const supabase = getSupabase()
  if (!supabase) return local

  const userId = await ensureUserId()
  if (!userId) return local

  const { data, error } = await supabase
    .from('check_ins')
    .select('id, timestamp, notes, entries')
    .eq('user_id', userId)

  if (error) {
    console.warn('Failed to load check-ins from Supabase', error.message)
    return local
  }

  const remote = (data ?? [])
    .map((row) =>
      normalizeCheckIn({
        id: row.id,
        timestamp: row.timestamp,
        notes: row.notes,
        entries: row.entries,
      }),
    )
    .filter((c): c is CheckIn => c !== null)

  const merged = mergeCheckIns(local, remote)
  saveCheckIns(merged)

  const remoteIds = new Set(remote.map((c) => c.id))
  const missing = merged.filter((c) => !remoteIds.has(c.id))
  if (missing.length > 0) {
    const payload = missing.map((c) => ({
      id: c.id,
      user_id: userId,
      timestamp: c.timestamp,
      notes: c.notes,
      entries: c.entries,
      updated_at: new Date().toISOString(),
    }))
    const { error: upsertError } = await supabase
      .from('check_ins')
      .upsert(payload, { onConflict: 'id' })
    if (upsertError) {
      console.warn('Failed to upload local check-ins', upsertError.message)
    }
  }

  return merged
}

export async function hydrateSettings(): Promise<AppSettings> {
  const local = loadSettings()
  const supabase = getSupabase()
  if (!supabase) return local

  const userId = await ensureUserId()
  if (!userId) return local

  const { data, error } = await supabase
    .from('app_settings')
    .select('categories')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.warn('Failed to load settings from Supabase', error.message)
    return local
  }

  if (data?.categories != null) {
    const remote = normalizeSettings({ categories: data.categories })
    saveSettings(remote)
    return remote
  }

  const { error: insertError } = await supabase.from('app_settings').upsert({
    user_id: userId,
    categories: local.categories,
    updated_at: new Date().toISOString(),
  })
  if (insertError) {
    console.warn('Failed to upload local settings', insertError.message)
  }
  return local
}

export async function pushCheckIn(checkIn: CheckIn): Promise<void> {
  const supabase = getSupabase()
  if (!supabase) return
  const userId = await ensureUserId()
  if (!userId) return

  const { error } = await supabase.from('check_ins').upsert(
    {
      id: checkIn.id,
      user_id: userId,
      timestamp: checkIn.timestamp,
      notes: checkIn.notes,
      entries: checkIn.entries,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  )
  if (error) console.warn('Failed to sync check-in', error.message)
}

export async function pushDeleteCheckIn(id: string): Promise<void> {
  const supabase = getSupabase()
  if (!supabase) return
  const userId = await ensureUserId()
  if (!userId) return

  const { error } = await supabase
    .from('check_ins')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
  if (error) console.warn('Failed to delete check-in remotely', error.message)
}

export async function pushSettings(settings: AppSettings): Promise<void> {
  const supabase = getSupabase()
  if (!supabase) return
  const userId = await ensureUserId()
  if (!userId) return

  const { error } = await supabase.from('app_settings').upsert({
    user_id: userId,
    categories: settings.categories,
    updated_at: new Date().toISOString(),
  })
  if (error) console.warn('Failed to sync settings', error.message)
}
