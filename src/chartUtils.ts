import { format, parseISO } from 'date-fns'
import type { CategoryConfig, CheckIn } from './types'

/**
 * Fill unrated points by interpolating between neighbours so chart lines stay
 * continuous. Trailing gaps after the last rating extend that value. Leading
 * gaps before the first rating stay null so a newly added category does not
 * flatline from older check-ins. Returns the input untouched when a series has
 * no ratings at all.
 */
export function fillGaps(values: Array<number | null>): Array<number | null> {
  const known: number[] = []
  values.forEach((v, i) => {
    if (v !== null) known.push(i)
  })
  if (known.length === 0) return values

  const out = [...values]
  const last = known[known.length - 1]

  for (let i = last + 1; i < values.length; i++) out[i] = values[last]

  for (let k = 0; k < known.length - 1; k++) {
    const a = known[k]
    const b = known[k + 1]
    const va = values[a] as number
    const vb = values[b] as number
    for (let i = a + 1; i < b; i++) {
      out[i] = va + ((vb - va) * (i - a)) / (b - a)
    }
  }
  return out
}

export interface DayAveragePoint {
  /** Local calendar day key, yyyy-MM-dd */
  dayKey: string
  /** Chart / tooltip label, e.g. "Mar 4" */
  label: string
  /** Mean of non-null ratings that day, keyed by category id */
  averages: Record<string, number | null>
  /** Activity ids logged on any check-in that day */
  activityIds: string[]
  checkInCount: number
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null
  const sum = values.reduce((acc, v) => acc + v, 0)
  return Math.round((sum / values.length) * 10) / 10
}

/**
 * Collapse check-ins onto local calendar days: one chart point per day with
 * averaged scale ratings and the union of activity tags logged that day.
 * Expects check-ins already sorted chronologically.
 */
export function averageCheckInsByDay(
  checkIns: CheckIn[],
  scaleCategoryIds: string[],
): DayAveragePoint[] {
  const byDay = new Map<
    string,
    {
      values: Record<string, number[]>
      activityIds: Set<string>
      checkInCount: number
    }
  >()

  for (const checkIn of checkIns) {
    const dayKey = format(parseISO(checkIn.timestamp), 'yyyy-MM-dd')
    let bucket = byDay.get(dayKey)
    if (!bucket) {
      bucket = {
        values: Object.fromEntries(scaleCategoryIds.map((id) => [id, []])),
        activityIds: new Set(),
        checkInCount: 0,
      }
      byDay.set(dayKey, bucket)
    }
    bucket.checkInCount += 1
    for (const catId of scaleCategoryIds) {
      const value = checkIn.entries[catId]?.value
      if (value != null) bucket.values[catId].push(value)
    }
    for (const entry of Object.values(checkIn.entries)) {
      for (const id of entry.activityIds) bucket.activityIds.add(id)
    }
  }

  return [...byDay.entries()].map(([dayKey, bucket]) => ({
    dayKey,
    label: format(parseISO(`${dayKey}T12:00:00`), 'MMM d'),
    averages: Object.fromEntries(
      scaleCategoryIds.map((id) => [id, mean(bucket.values[id] ?? [])]),
    ),
    activityIds: [...bucket.activityIds],
    checkInCount: bucket.checkInCount,
  }))
}

export interface FlatActivity {
  categoryId: string
  categoryLabel: string
  color: string
  id: string
  label: string
}

export function flattenActivities(categories: CategoryConfig[]): FlatActivity[] {
  return categories.flatMap((c) =>
    c.activities.map((tag) => ({
      categoryId: c.id,
      categoryLabel: c.label,
      // Mark activities with their parent category color (Trends, insights, chips).
      color: c.color,
      id: tag.id,
      label: tag.label,
    })),
  )
}

/** Stable distinct colors so activities stay readable even within one category. */
const ACTIVITY_PALETTE = [
  '#2a9d8f',
  '#e76f51',
  '#457b9d',
  '#c9a227',
  '#9b5de5',
  '#ef476f',
  '#00bbf9',
  '#f15bb5',
  '#90be6d',
  '#f4a261',
  '#264653',
  '#e9c46a',
]

export function activityPaletteColor(id: string, fallback = '#1f6f5b'): string {
  if (!id) return fallback
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  }
  return ACTIVITY_PALETTE[hash % ACTIVITY_PALETTE.length]
}

export function nextActivityColor(existingCount: number): string {
  return ACTIVITY_PALETTE[existingCount % ACTIVITY_PALETTE.length]
}

export interface ActivityPair {
  left: FlatActivity
  right: FlatActivity
  count: number
}

function activityIdsOnCheckIn(checkIn: CheckIn): string[] {
  const ids = new Set<string>()
  for (const entry of Object.values(checkIn.entries)) {
    for (const id of entry.activityIds) ids.add(id)
  }
  return [...ids]
}

/**
 * Rank activity pairs that appear together on the same check-in.
 * Only pairs that co-occur at least twice are returned.
 */
export function activityCooccurrences(
  checkIns: CheckIn[],
  activities: FlatActivity[],
  limit = 6,
): ActivityPair[] {
  const byId = new Map(activities.map((a) => [a.id, a]))
  const pairCounts = new Map<string, number>()

  for (const checkIn of checkIns) {
    const ids = activityIdsOnCheckIn(checkIn)
      .filter((id) => byId.has(id))
      .sort()
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const key = `${ids[i]}|${ids[j]}`
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1)
      }
    }
  }

  return [...pairCounts.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .flatMap(([key, count]) => {
      const [leftId, rightId] = key.split('|')
      const left = byId.get(leftId)
      const right = byId.get(rightId)
      if (!left || !right) return []
      return [{ left, right, count }]
    })
}
