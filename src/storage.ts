import {
  CHECKINS_KEY,
  LEGACY_CHECKINS_KEY,
  SETTINGS_KEY,
  defaultSettings,
} from './constants'
import type {
  ActivityTag,
  AppSettings,
  CategoryConfig,
  CategoryEntry,
  CheckIn,
} from './types'
import { emptyEntry } from './types'

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeEntry(raw: unknown): { entry: CategoryEntry; legacyNotes: string } {
  if (!isObject(raw)) return { entry: emptyEntry(), legacyNotes: '' }
  const value =
    typeof raw.value === 'number' && raw.value >= 1 && raw.value <= 10
      ? Math.round(raw.value)
      : null
  const legacyNotes = typeof raw.notes === 'string' ? raw.notes.trim() : ''

  let activityIds: string[] = []
  if (Array.isArray(raw.activityIds)) {
    activityIds = raw.activityIds.filter((id): id is string => typeof id === 'string')
  } else if (Array.isArray(raw.eventIds)) {
    activityIds = raw.eventIds.filter((id): id is string => typeof id === 'string')
  }

  return { entry: { value, activityIds }, legacyNotes }
}

export function normalizeCheckIn(raw: unknown): CheckIn | null {
  if (!isObject(raw)) return null
  if (typeof raw.id !== 'string' || typeof raw.timestamp !== 'string') return null

  const entries: Record<string, CategoryEntry> = {}
  const noteParts: string[] = []

  if (typeof raw.notes === 'string' && raw.notes.trim()) {
    noteParts.push(raw.notes.trim())
  }

  const source = isObject(raw.entries)
    ? raw.entries
    : isObject(raw.ratings)
      ? raw.ratings
      : null

  if (source) {
    for (const [key, value] of Object.entries(source)) {
      const { entry, legacyNotes } = normalizeEntry(value)
      entries[key] = entry
      if (legacyNotes) noteParts.push(legacyNotes)
    }
  }

  return {
    id: raw.id,
    timestamp: raw.timestamp,
    notes: noteParts.join('\n'),
    entries,
  }
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

function normalizeActivityTag(raw: unknown): ActivityTag | null {
  if (!isObject(raw)) return null
  if (typeof raw.id !== 'string' || typeof raw.label !== 'string') return null
  const label = raw.label.trim()
  if (!label) return null
  return {
    id: raw.id,
    label,
    color: typeof raw.color === 'string' ? raw.color : undefined,
  }
}

function normalizeCategory(raw: unknown): CategoryConfig | null {
  if (!isObject(raw)) return null
  if (typeof raw.id !== 'string' || typeof raw.label !== 'string') return null
  if (typeof raw.color !== 'string') return null

  const activitiesRaw = Array.isArray(raw.activities)
    ? raw.activities
    : Array.isArray(raw.eventTags)
      ? raw.eventTags
      : []

  const activities = activitiesRaw
    .map(normalizeActivityTag)
    .filter((t): t is ActivityTag => t !== null)

  return {
    id: raw.id,
    label: raw.label,
    color: raw.color,
    description: typeof raw.description === 'string' ? raw.description : '',
    lowLabel: typeof raw.lowLabel === 'string' ? raw.lowLabel : 'Low',
    highLabel: typeof raw.highLabel === 'string' ? raw.highLabel : 'High',
    hasScale: typeof raw.hasScale === 'boolean' ? raw.hasScale : true,
    activities,
  }
}

export function normalizeSettings(raw: unknown): AppSettings {
  if (!isObject(raw) || !Array.isArray(raw.categories)) {
    return defaultSettings()
  }
  const categories = raw.categories
    .map(normalizeCategory)
    .filter((c): c is CategoryConfig => c !== null)
  if (categories.length === 0) return defaultSettings()
  return { categories }
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return defaultSettings()
    return normalizeSettings(JSON.parse(raw) as unknown)
  } catch {
    return defaultSettings()
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}
