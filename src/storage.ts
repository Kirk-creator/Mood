import {
  CHECKINS_KEY,
  LEGACY_CHECKINS_KEY,
  SETTINGS_KEY,
  defaultSettings,
} from './constants'
import type {
  AppSettings,
  CategoryConfig,
  CategoryEntry,
  CheckIn,
  EventTag,
} from './types'
import { emptyEntry } from './types'

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeEntry(raw: unknown): CategoryEntry {
  if (!isObject(raw)) return emptyEntry()
  const value =
    typeof raw.value === 'number' && raw.value >= 1 && raw.value <= 10
      ? Math.round(raw.value)
      : null
  const notes = typeof raw.notes === 'string' ? raw.notes : ''
  const eventIds = Array.isArray(raw.eventIds)
    ? raw.eventIds.filter((id): id is string => typeof id === 'string')
    : []
  return { value, notes, eventIds }
}

function migrateLegacyCheckIn(raw: Record<string, unknown>): CheckIn | null {
  if (typeof raw.id !== 'string' || typeof raw.timestamp !== 'string') return null
  const ratings = isObject(raw.ratings) ? raw.ratings : {}
  const entries: Record<string, CategoryEntry> = {}
  for (const [key, value] of Object.entries(ratings)) {
    entries[key] = normalizeEntry(value)
  }
  return { id: raw.id, timestamp: raw.timestamp, entries }
}

function normalizeCheckIn(raw: unknown): CheckIn | null {
  if (!isObject(raw)) return null
  if (typeof raw.id !== 'string' || typeof raw.timestamp !== 'string') return null

  if (isObject(raw.entries)) {
    const entries: Record<string, CategoryEntry> = {}
    for (const [key, value] of Object.entries(raw.entries)) {
      entries[key] = normalizeEntry(value)
    }
    return { id: raw.id, timestamp: raw.timestamp, entries }
  }

  // Legacy v1 shape: { ratings: { mood: { value, notes }, ... } }
  if (isObject(raw.ratings)) {
    return migrateLegacyCheckIn(raw)
  }

  return null
}

export function loadCheckIns(): CheckIn[] {
  try {
    const raw = localStorage.getItem(CHECKINS_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (!Array.isArray(parsed)) return []
      return parsed
        .map(normalizeCheckIn)
        .filter((c): c is CheckIn => c !== null)
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )
    }

    // One-time migrate from v1
    const legacy = localStorage.getItem(LEGACY_CHECKINS_KEY)
    if (!legacy) return []
    const parsed: unknown = JSON.parse(legacy)
    if (!Array.isArray(parsed)) return []
    const migrated = parsed
      .map(normalizeCheckIn)
      .filter((c): c is CheckIn => c !== null)
    saveCheckIns(migrated)
    return migrated
  } catch {
    return []
  }
}

export function saveCheckIns(checkIns: CheckIn[]): void {
  localStorage.setItem(CHECKINS_KEY, JSON.stringify(checkIns))
}

export function createCheckIn(checkIn: CheckIn): CheckIn[] {
  const next = [checkIn, ...loadCheckIns()]
  saveCheckIns(next)
  return next
}

export function updateCheckIn(updated: CheckIn): CheckIn[] {
  const next = loadCheckIns().map((item) =>
    item.id === updated.id ? updated : item,
  )
  saveCheckIns(next)
  return next
}

export function deleteCheckIn(id: string): CheckIn[] {
  const next = loadCheckIns().filter((item) => item.id !== id)
  saveCheckIns(next)
  return next
}

function normalizeEventTag(raw: unknown): EventTag | null {
  if (!isObject(raw)) return null
  if (typeof raw.id !== 'string' || typeof raw.label !== 'string') return null
  const label = raw.label.trim()
  if (!label) return null
  return { id: raw.id, label }
}

function normalizeCategory(raw: unknown): CategoryConfig | null {
  if (!isObject(raw)) return null
  if (typeof raw.id !== 'string' || typeof raw.label !== 'string') return null
  if (typeof raw.color !== 'string') return null
  const eventTags = Array.isArray(raw.eventTags)
    ? raw.eventTags.map(normalizeEventTag).filter((t): t is EventTag => t !== null)
    : []
  return {
    id: raw.id,
    label: raw.label,
    color: raw.color,
    description: typeof raw.description === 'string' ? raw.description : '',
    lowLabel: typeof raw.lowLabel === 'string' ? raw.lowLabel : 'Low',
    highLabel: typeof raw.highLabel === 'string' ? raw.highLabel : 'High',
    eventTags,
  }
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return defaultSettings()
    const parsed: unknown = JSON.parse(raw)
    if (!isObject(parsed) || !Array.isArray(parsed.categories)) {
      return defaultSettings()
    }
    const categories = parsed.categories
      .map(normalizeCategory)
      .filter((c): c is CategoryConfig => c !== null)
    if (categories.length === 0) return defaultSettings()
    return { categories }
  } catch {
    return defaultSettings()
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}
