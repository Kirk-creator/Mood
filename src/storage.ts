import {
  CHECKINS_KEY,
  DEFAULT_CATEGORIES,
  LEGACY_CHECKINS_KEY,
  LEGACY_STOCK_CATEGORY_IDS,
  SETTINGS_KEY,
  defaultSettings,
} from './constants'
import { activityPaletteColor } from './chartUtils'
import type {
  ActivityTag,
  AppSettings,
  CategoryConfig,
  CategoryEntry,
  CheckIn,
} from './types'
import { emptyEntry } from './types'

/** Active account for scoped localStorage keys. Null = guest/legacy keys. */
let activeUserId: string | null = null

export function setStorageUserId(userId: string | null): void {
  activeUserId = userId
}

export function getStorageUserId(): string | null {
  return activeUserId
}

function scopedKey(base: string): string {
  return activeUserId ? `${base}:${activeUserId}` : base
}

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
    const raw = localStorage.getItem(scopedKey(CHECKINS_KEY))
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

    // Only migrate legacy unscoped keys for guest mode.
    if (activeUserId) return []

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
  localStorage.setItem(scopedKey(CHECKINS_KEY), JSON.stringify(checkIns))
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
    // Missing field → off. Starters set true explicitly in DEFAULT_CATEGORIES /
    // applyPreferredStarterCategories so Trends does not pick up stock leftovers.
    hasScale: typeof raw.hasScale === 'boolean' ? raw.hasScale : false,
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
    const raw = localStorage.getItem(scopedKey(SETTINGS_KEY))
    if (!raw) return defaultSettings()
    return applyPreferredStarterCategories(
      normalizeSettings(JSON.parse(raw) as unknown),
    )
  } catch {
    return defaultSettings()
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(scopedKey(SETTINGS_KEY), JSON.stringify(settings))
}

/** Unscoped browser cache left from before accounts existed. */
export function loadLegacyGuestCheckIns(): CheckIn[] {
  try {
    const raw =
      localStorage.getItem(CHECKINS_KEY) ??
      localStorage.getItem(LEGACY_CHECKINS_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .map(normalizeCheckIn)
      .filter((c): c is CheckIn => c !== null)
  } catch {
    return []
  }
}

export function loadLegacyGuestSettings(): AppSettings | null {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return null
    return normalizeSettings(JSON.parse(raw) as unknown)
  } catch {
    return null
  }
}

/** Prefer primary categories; fill empty activity lists from fallback by id/label. */
export function mergeSettingsActivities(
  primary: AppSettings,
  fallback: AppSettings | null,
): AppSettings {
  if (!fallback) return primary
  const byId = new Map(fallback.categories.map((c) => [c.id, c]))
  const byLabel = new Map(
    fallback.categories.map((c) => [c.label.trim().toLowerCase(), c]),
  )

  return {
    categories: primary.categories.map((cat) => {
      if (cat.activities.length > 0) return cat
      const donor =
        byId.get(cat.id) ?? byLabel.get(cat.label.trim().toLowerCase())
      if (!donor || donor.activities.length === 0) return cat
      return { ...cat, activities: donor.activities.map((a) => ({ ...a })) }
    }),
  }
}

/**
 * Rebuild missing activity definitions referenced by check-ins so Trends /
 * Check-in chips don't disappear after a settings wipe.
 */
export function recoverActivitiesFromCheckIns(
  settings: AppSettings,
  checkIns: CheckIn[],
): AppSettings {
  const knownIds = new Set(
    settings.categories.flatMap((c) => c.activities.map((a) => a.id)),
  )
  const orphansByCat = new Map<string, string[]>()

  for (const checkIn of checkIns) {
    for (const [catId, entry] of Object.entries(checkIn.entries)) {
      for (const activityId of entry.activityIds) {
        if (knownIds.has(activityId)) continue
        const list = orphansByCat.get(catId) ?? []
        if (!list.includes(activityId)) list.push(activityId)
        orphansByCat.set(catId, list)
      }
    }
  }

  if (orphansByCat.size === 0) return settings

  return {
    categories: settings.categories.map((cat) => {
      const orphanIds = orphansByCat.get(cat.id)
      if (!orphanIds || orphanIds.length === 0) return cat
      const extras: ActivityTag[] = orphanIds.map((id, index) => ({
        id,
        label: `Saved activity ${cat.activities.length + index + 1}`,
        color: activityPaletteColor(id, cat.color),
      }))
      return { ...cat, activities: [...cat.activities, ...extras] }
    }),
  }
}

export function settingsEqual(a: AppSettings, b: AppSettings): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

const CATEGORY_ALIASES_KEY = 'pulse-category-aliases-v1'
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function loadPersistedAliases(): Record<string, string> {
  try {
    const raw = localStorage.getItem(scopedKey(CATEGORY_ALIASES_KEY))
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (!isObject(parsed)) return {}
    const out: Record<string, string> = {}
    for (const [from, to] of Object.entries(parsed)) {
      if (typeof to === 'string' && from && to && from !== to) out[from] = to
    }
    return out
  } catch {
    return {}
  }
}

function savePersistedAliases(aliases: Record<string, string>): void {
  const existing = loadPersistedAliases()
  const merged = { ...existing, ...aliases }
  localStorage.setItem(scopedKey(CATEGORY_ALIASES_KEY), JSON.stringify(merged))
}

function mergeCategoryEntries(
  primary: CategoryEntry | undefined,
  incoming: CategoryEntry,
): CategoryEntry {
  if (!primary) return { ...incoming, activityIds: [...incoming.activityIds] }
  const activityIds = [...primary.activityIds]
  for (const id of incoming.activityIds) {
    if (!activityIds.includes(id)) activityIds.push(id)
  }
  return {
    value: primary.value ?? incoming.value,
    activityIds,
  }
}

function mergeActivityLists(
  primary: ActivityTag[],
  incoming: ActivityTag[],
): ActivityTag[] {
  const byId = new Map(primary.map((a) => [a.id, a]))
  const byLabel = new Map(
    primary.map((a) => [a.label.trim().toLowerCase(), a]),
  )
  const out = primary.map((a) => ({ ...a }))
  for (const tag of incoming) {
    if (byId.has(tag.id)) continue
    if (byLabel.has(tag.label.trim().toLowerCase())) continue
    out.push({ ...tag })
    byId.set(tag.id, tag)
    byLabel.set(tag.label.trim().toLowerCase(), tag)
  }
  return out
}

/**
 * Map old category ids → current ids when labels match a starter (e.g. a
 * custom UUID "Anxiety" category → stock `anxiety`).
 */
export function collectCategoryIdAliases(
  target: AppSettings,
  sources: Array<AppSettings | null | undefined>,
): Record<string, string> {
  const aliases: Record<string, string> = { ...loadPersistedAliases() }
  const targetById = new Map(target.categories.map((c) => [c.id, c]))
  const targetByLabel = new Map(
    target.categories.map((c) => [c.label.trim().toLowerCase(), c.id]),
  )

  for (const def of DEFAULT_CATEGORIES) {
    if (targetById.has(def.id)) {
      targetByLabel.set(def.label.trim().toLowerCase(), def.id)
    }
  }

  for (const source of sources) {
    if (!source) continue
    for (const cat of source.categories) {
      if (targetById.has(cat.id)) continue
      const dest =
        targetByLabel.get(cat.label.trim().toLowerCase()) ??
        DEFAULT_CATEGORIES.find(
          (d) => d.label.trim().toLowerCase() === cat.label.trim().toLowerCase(),
        )?.id
      if (dest && dest !== cat.id) aliases[cat.id] = dest
    }
  }

  for (const cat of target.categories) {
    const def = DEFAULT_CATEGORIES.find(
      (d) => d.label.trim().toLowerCase() === cat.label.trim().toLowerCase(),
    )
    if (def && def.id !== cat.id) aliases[cat.id] = def.id
  }

  return aliases
}

/**
 * Last resort: a single orphan UUID with ratings, while stock Anxiety has none,
 * is almost always a pre-starter custom Anxiety category.
 */
export function inferOrphanStarterAliases(
  checkIns: CheckIn[],
  settings: AppSettings,
): Record<string, string> {
  const known = new Set(settings.categories.map((c) => c.id))
  const orphanIds = new Set<string>()
  for (const checkIn of checkIns) {
    for (const [id, entry] of Object.entries(checkIn.entries)) {
      if (known.has(id)) continue
      if (entry.value !== null || entry.activityIds.length > 0) orphanIds.add(id)
    }
  }

  const uuidOrphans = [...orphanIds].filter((id) => UUID_RE.test(id))
  if (uuidOrphans.length !== 1) return {}
  if (!settings.categories.some((c) => c.id === 'anxiety')) return {}

  const orphanId = uuidOrphans[0]
  let orphanUsed = false
  let anxietyUsed = false
  for (const checkIn of checkIns) {
    const orphan = checkIn.entries[orphanId]
    if (orphan && (orphan.value !== null || orphan.activityIds.length > 0)) {
      orphanUsed = true
    }
    const anxiety = checkIn.entries.anxiety
    if (anxiety && (anxiety.value !== null || anxiety.activityIds.length > 0)) {
      anxietyUsed = true
    }
  }
  if (orphanUsed && !anxietyUsed) return { [orphanId]: 'anxiety' }
  return {}
}

export function remapCheckInCategoryIds(
  checkIns: CheckIn[],
  aliases: Record<string, string>,
): CheckIn[] {
  const pairs = Object.entries(aliases).filter(([from, to]) => from && to && from !== to)
  if (pairs.length === 0) return checkIns

  let anyChanged = false
  const next = checkIns.map((checkIn) => {
    let changed = false
    const entries = { ...checkIn.entries }
    for (const [from, to] of pairs) {
      if (!(from in entries)) continue
      const incoming = entries[from]
      delete entries[from]
      entries[to] = mergeCategoryEntries(entries[to], incoming)
      changed = true
    }
    if (!changed) return checkIn
    anyChanged = true
    return { ...checkIn, entries }
  })
  return anyChanged ? next : checkIns
}

/**
 * Fold custom categories that duplicate starter labels (e.g. UUID Anxiety)
 * into Mood / Energy / Health / Anxiety, returning id aliases for check-ins.
 */
export function foldDuplicateStarterCategories(settings: AppSettings): {
  settings: AppSettings
  aliases: Record<string, string>
} {
  const aliases: Record<string, string> = {}
  const preferredByLabel = new Map(
    DEFAULT_CATEGORIES.map((d) => [d.label.trim().toLowerCase(), d]),
  )
  const starterBuckets = new Map<string, CategoryConfig>()
  const extras: CategoryConfig[] = []

  for (const cat of settings.categories) {
    const def = preferredByLabel.get(cat.label.trim().toLowerCase())
    if (!def) {
      extras.push(cat)
      continue
    }
    if (cat.id !== def.id) aliases[cat.id] = def.id
    const prev = starterBuckets.get(def.id)
    if (!prev) {
      starterBuckets.set(def.id, {
        ...def,
        label: cat.label || def.label,
        color: cat.color || def.color,
        description: cat.description || def.description,
        lowLabel: cat.lowLabel || def.lowLabel,
        highLabel: cat.highLabel || def.highLabel,
        hasScale: true,
        activities: cat.activities.map((a) => ({ ...a })),
      })
    } else {
      starterBuckets.set(def.id, {
        ...prev,
        activities: mergeActivityLists(prev.activities, cat.activities),
      })
    }
  }

  const starters = DEFAULT_CATEGORIES.map((def) => {
    const existing = starterBuckets.get(def.id)
    if (!existing) return { ...def, activities: [] }
    return existing
  })

  return {
    settings: { categories: [...starters, ...extras] },
    aliases,
  }
}

/**
 * Slim old stock category packs down to Mood / Energy / Health / Anxiety,
 * keeping activities on those starters and preserving any other stock
 * categories that still have activities (activity-only — scale off).
 */
export function applyPreferredStarterCategories(
  settings: AppSettings,
): AppSettings {
  const folded = foldDuplicateStarterCategories(settings)
  if (Object.keys(folded.aliases).length > 0) {
    savePersistedAliases(folded.aliases)
  }
  settings = folded.settings

  const stock = new Set<string>([...LEGACY_STOCK_CATEGORY_IDS, 'anxiety'])
  if (!settings.categories.every((c) => stock.has(c.id))) return settings

  const preferred = DEFAULT_CATEGORIES.map((c) => c.id)
  const preferredSet = new Set(preferred)
  const byId = new Map(settings.categories.map((c) => [c.id, c]))

  const starters = DEFAULT_CATEGORIES.map((def) => {
    const existing = byId.get(def.id)
    if (!existing) return { ...def, activities: [] }
    return {
      ...def,
      label: existing.label || def.label,
      color: existing.color || def.color,
      description: existing.description || def.description,
      lowLabel: existing.lowLabel || def.lowLabel,
      highLabel: existing.highLabel || def.highLabel,
      hasScale: true,
      activities: existing.activities.map((a) => ({ ...a })),
    }
  })

  const extras = settings.categories
    .filter((c) => !preferredSet.has(c.id) && c.activities.length > 0)
    .map((c) => ({
      ...c,
      hasScale: false,
    }))

  return { categories: [...starters, ...extras] }
}

/**
 * Fold duplicate starters, remap orphaned check-in entry keys onto current
 * category ids, and persist aliases so History stops showing raw UUIDs.
 */
export function reconcileCategoriesAndCheckIns(
  settings: AppSettings,
  checkIns: CheckIn[],
  historical: Array<AppSettings | null | undefined> = [],
): { settings: AppSettings; checkIns: CheckIn[] } {
  const folded = foldDuplicateStarterCategories(settings)
  let nextSettings = applyPreferredStarterCategories(folded.settings)

  const aliases = {
    ...folded.aliases,
    ...collectCategoryIdAliases(nextSettings, [
      settings,
      folded.settings,
      ...historical,
    ]),
    ...inferOrphanStarterAliases(checkIns, nextSettings),
  }

  if (Object.keys(aliases).length > 0) {
    savePersistedAliases(aliases)
  }

  const nextCheckIns = remapCheckInCategoryIds(checkIns, aliases)
  nextSettings = recoverActivitiesFromCheckIns(nextSettings, nextCheckIns)

  return { settings: nextSettings, checkIns: nextCheckIns }
}

export function checkInsEqual(a: CheckIn[], b: CheckIn[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}
