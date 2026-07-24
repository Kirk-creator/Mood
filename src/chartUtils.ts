import { eachDayOfInterval, format, parseISO } from 'date-fns'
import type { CategoryConfig, CheckIn } from './types'

/**
 * Fill unrated points by interpolating between neighbours so chart lines stay
 * continuous. Leading/trailing gaps extend the nearest known value. Returns the
 * input untouched when a series has no ratings at all.
 */
export function fillGaps(values: Array<number | null>): Array<number | null> {
  const known: number[] = []
  values.forEach((v, i) => {
    if (v !== null) known.push(i)
  })
  if (known.length === 0) return values

  const out = [...values]
  const first = known[0]
  const last = known[known.length - 1]

  for (let i = 0; i < first; i++) out[i] = values[first]
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
      color: tag.color || activityPaletteColor(tag.id, c.color),
      id: tag.id,
      label: tag.label,
    })),
  )
}

/** Stable distinct colors so stacked bars stay readable even within one category. */
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

export type FrequencyGranularity = 'hour' | 'weekday' | 'date'

export interface FrequencyBucket {
  label: string
  count: number
}

/** One row per time bucket; each activity id is a numeric series key. */
export type FrequencySeriesRow = { label: string } & Record<string, string | number>

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function hourLabel(hour: number): string {
  if (hour === 0) return '12a'
  if (hour === 12) return '12p'
  return hour < 12 ? `${hour}a` : `${hour - 12}p`
}

function emptySeriesRow(
  label: string,
  activityIds: string[],
): FrequencySeriesRow {
  const row: FrequencySeriesRow = { label }
  for (const id of activityIds) row[id] = 0
  return row
}

function addActivityCounts(
  row: FrequencySeriesRow,
  checkIn: CheckIn,
  activityIds: Set<string>,
): void {
  for (const entry of Object.values(checkIn.entries)) {
    for (const id of entry.activityIds) {
      if (activityIds.has(id)) {
        row[id] = (row[id] as number) + 1
      }
    }
  }
}

/**
 * Count how often each activity was logged, bucketed by hour / weekday / date.
 * Returns one numeric column per activity id for stacked bar charts.
 */
export function activityFrequencySeries(
  checkIns: CheckIn[],
  granularity: FrequencyGranularity,
  activityIds: string[],
): FrequencySeriesRow[] {
  if (activityIds.length === 0) return []
  const idSet = new Set(activityIds)

  if (granularity === 'hour') {
    const rows = Array.from({ length: 24 }, (_, hour) =>
      emptySeriesRow(hourLabel(hour), activityIds),
    )
    for (const checkIn of checkIns) {
      const hour = parseISO(checkIn.timestamp).getHours()
      addActivityCounts(rows[hour], checkIn, idSet)
    }
    return rows
  }

  if (granularity === 'weekday') {
    const rows = Array.from({ length: 7 }, (_, day) =>
      emptySeriesRow(WEEKDAYS[day], activityIds),
    )
    for (const checkIn of checkIns) {
      const day = parseISO(checkIn.timestamp).getDay()
      addActivityCounts(rows[day], checkIn, idSet)
    }
    return rows
  }

  if (checkIns.length === 0) return []

  const times = checkIns.map((c) => parseISO(c.timestamp))
  const start = new Date(Math.min(...times.map((t) => t.getTime())))
  const end = new Date(Math.max(...times.map((t) => t.getTime())))

  const rows = eachDayOfInterval({ start, end }).map((day) =>
    emptySeriesRow(format(day, 'MMM d'), activityIds),
  )
  const indexByLabel = new Map(rows.map((row, i) => [row.label, i]))

  for (const checkIn of checkIns) {
    const key = format(parseISO(checkIn.timestamp), 'MMM d')
    const idx = indexByLabel.get(key)
    if (idx === undefined) continue
    addActivityCounts(rows[idx], checkIn, idSet)
  }

  return rows
}

/**
 * Combined single-series frequency (kept for simpler totals / tests).
 */
export function activityFrequency(
  checkIns: CheckIn[],
  granularity: FrequencyGranularity,
  activityIds: Set<string>,
): FrequencyBucket[] {
  if (activityIds.size === 0) return []
  const series = activityFrequencySeries(checkIns, granularity, [...activityIds])
  return series.map((row) => {
    let count = 0
    for (const id of activityIds) count += row[id] as number
    return { label: row.label, count }
  })
}
