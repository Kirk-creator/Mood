import { v4 as uuidv4 } from 'uuid'
import { defaultSettings } from '../constants'
import type { AppSettings, CheckIn } from '../types'
import {
  loadCheckIns,
  loadLegacyGuestCheckIns,
  loadLegacyGuestSettings,
  loadSettings,
  normalizeCheckIn,
  normalizeSettings,
  saveCheckIns,
  saveSettings,
  setStorageUserId,
} from '../storage'
import { getSupabase, requireUserId } from './supabase'

export class CloudSyncError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CloudSyncError'
  }
}

function sortCheckIns(checkIns: CheckIn[]): CheckIn[] {
  return [...checkIns].sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )
}

function explainReadError(detail: string): string {
  if (
    /schema cache|PGRST002|pg_pgrst_no_exposed_schemas|Could not query the database/i.test(
      detail,
    )
  ) {
    return `Supabase Data API/PostgREST is disabled or broken (${detail}). Enable Project Settings → Data API with the public schema exposed.`
  }
  return `Could not read check_ins (${detail}). Run supabase/migrations/001_pulse.sql in the SQL editor.`
}

/** Bind local cache to this account, then load their cloud data. */
export async function hydrateAccount(userId: string): Promise<{
  checkIns: CheckIn[]
  settings: AppSettings
}> {
  setStorageUserId(userId)
  const checkIns = await hydrateCheckIns()
  const settings = await hydrateSettings()
  return { checkIns, settings }
}

export function clearAccountCache(): void {
  setStorageUserId(null)
}

export async function hydrateCheckIns(): Promise<CheckIn[]> {
  const supabase = getSupabase()
  if (!supabase) return loadCheckIns()

  const userId = await requireUserId()
  if (!userId) {
    throw new CloudSyncError('Sign in to load your check-ins from Supabase.')
  }
  setStorageUserId(userId)

  const { data, error } = await supabase
    .from('check_ins')
    .select('id, timestamp, notes, entries')
    .eq('user_id', userId)

  if (error) {
    throw new CloudSyncError(explainReadError(error.message || 'unknown error'))
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

  // Returning users: remote is the source of truth.
  if (remote.length > 0) {
    const sorted = sortCheckIns(remote)
    saveCheckIns(sorted)
    return sorted
  }

  // New account with empty cloud: import prior guest/local data once, if any.
  // Remint IDs so we never upsert over rows owned by a previous anonymous user
  // (that triggers RLS USING failures on the UPDATE path of upsert).
  const guest = loadLegacyGuestCheckIns()
  const local = loadCheckIns()
  const seedSource = local.length > 0 ? local : guest
  if (seedSource.length === 0) {
    saveCheckIns([])
    return []
  }

  const seeded: CheckIn[] = seedSource.map((c) => ({
    ...c,
    id: uuidv4(),
  }))

  const payload = seeded.map((c) => ({
    id: c.id,
    user_id: userId,
    timestamp: c.timestamp,
    notes: c.notes,
    entries: c.entries,
    updated_at: new Date().toISOString(),
  }))
  const { error: insertError } = await supabase.from('check_ins').insert(payload)
  if (insertError) {
    throw new CloudSyncError(
      `Could not upload check-ins (${insertError.message}).`,
    )
  }
  const sorted = sortCheckIns(seeded)
  saveCheckIns(sorted)
  return sorted
}

export async function hydrateSettings(): Promise<AppSettings> {
  const supabase = getSupabase()
  if (!supabase) return loadSettings()

  const userId = await requireUserId()
  if (!userId) return defaultSettings()
  setStorageUserId(userId)

  const { data, error } = await supabase
    .from('app_settings')
    .select('categories')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.warn('Failed to load settings from Supabase', error.message)
    return loadSettings()
  }

  if (data?.categories != null) {
    const remote = normalizeSettings({ categories: data.categories })
    saveSettings(remote)
    return remote
  }

  const local = loadSettings()
  const guest = loadLegacyGuestSettings()
  const seed =
    local.categories.length > 0
      ? local
      : (guest ?? defaultSettings())

  const { error: insertError } = await supabase.from('app_settings').upsert({
    user_id: userId,
    categories: seed.categories,
    updated_at: new Date().toISOString(),
  })
  if (insertError) {
    console.warn('Failed to upload settings', insertError.message)
  }
  saveSettings(seed)
  return seed
}

export async function pushCheckIn(checkIn: CheckIn): Promise<CheckIn | null> {
  const supabase = getSupabase()
  if (!supabase) return checkIn
  const userId = await requireUserId()
  if (!userId) return checkIn

  const row = {
    id: checkIn.id,
    user_id: userId,
    timestamp: checkIn.timestamp,
    notes: checkIn.notes,
    entries: checkIn.entries,
    updated_at: new Date().toISOString(),
  }

  // Prefer update of our own row; if missing, insert. Avoids upsert UPDATE
  // against another user's colliding primary key (RLS USING failure).
  const { data: updated, error: updateError } = await supabase
    .from('check_ins')
    .update({
      timestamp: row.timestamp,
      notes: row.notes,
      entries: row.entries,
      updated_at: row.updated_at,
    })
    .eq('id', checkIn.id)
    .eq('user_id', userId)
    .select('id')

  if (updateError) {
    console.warn('Failed to sync check-in', updateError.message)
    return null
  }
  if (updated && updated.length > 0) return checkIn

  const { error: insertError } = await supabase.from('check_ins').insert(row)
  if (!insertError) return checkIn

  // ID may already belong to another account — remint and insert.
  if (/row-level security|duplicate key/i.test(insertError.message)) {
    const reminted: CheckIn = { ...checkIn, id: uuidv4() }
    const { error: retryError } = await supabase.from('check_ins').insert({
      ...row,
      id: reminted.id,
    })
    if (retryError) {
      console.warn('Failed to sync check-in', retryError.message)
      return null
    }
    const next = loadCheckIns().map((item) =>
      item.id === checkIn.id ? reminted : item,
    )
    saveCheckIns(next)
    return reminted
  }

  console.warn('Failed to sync check-in', insertError.message)
  return null
}

export async function pushDeleteCheckIn(id: string): Promise<void> {
  const supabase = getSupabase()
  if (!supabase) return
  const userId = await requireUserId()
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
  const userId = await requireUserId()
  if (!userId) return

  const { error } = await supabase.from('app_settings').upsert({
    user_id: userId,
    categories: settings.categories,
    updated_at: new Date().toISOString(),
  })
  if (error) console.warn('Failed to sync settings', error.message)
}
