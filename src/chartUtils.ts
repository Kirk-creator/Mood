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
      color: c.color,
      id: tag.id,
      label: tag.label,
    })),
  )
}

export type FrequencyGranularity = 'hour' | 'weekday' | 'date'

export interface FrequencyBucket {
  label: string
  count: number
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function hourLabel(hour: number): string {
  if (hour === 0) return '12a'
  if (hour === 12) return '12p'
  return hour < 12 ? `${hour}a` : `${hour - 12}p`
}

function countMatches(checkIn: CheckIn, activityIds: Set<string>): number {
  let total = 0
  for (const entry of Object.values(checkIn.entries)) {
    for (const id of entry.activityIds) {
      if (activityIds.has(id)) total++
    }
  }
  return total
}

/**
 * Count how often the given activities were logged, bucketed by hour of day,
 * day of week, or calendar date.
 */
export function activityFrequency(
  checkIns: CheckIn[],
  granularity: FrequencyGranularity,
  activityIds: Set<string>,
): FrequencyBucket[] {
  if (activityIds.size === 0) return []

  if (granularity === 'hour') {
    const counts = new Array<number>(24).fill(0)
    for (const checkIn of checkIns) {
      const hour = parseISO(checkIn.timestamp).getHours()
      counts[hour] += countMatches(checkIn, activityIds)
    }
    return counts.map((count, hour) => ({ label: hourLabel(hour), count }))
  }

  if (granularity === 'weekday') {
    const counts = new Array<number>(7).fill(0)
    for (const checkIn of checkIns) {
      const day = parseISO(checkIn.timestamp).getDay()
      counts[day] += countMatches(checkIn, activityIds)
    }
    return counts.map((count, day) => ({ label: WEEKDAYS[day], count }))
  }

  if (checkIns.length === 0) return []

  const times = checkIns.map((c) => parseISO(c.timestamp))
  const start = new Date(Math.min(...times.map((t) => t.getTime())))
  const end = new Date(Math.max(...times.map((t) => t.getTime())))

  const buckets = new Map<string, number>()
  for (const day of eachDayOfInterval({ start, end })) {
    buckets.set(format(day, 'MMM d'), 0)
  }
  for (const checkIn of checkIns) {
    const key = format(parseISO(checkIn.timestamp), 'MMM d')
    buckets.set(key, (buckets.get(key) ?? 0) + countMatches(checkIn, activityIds))
  }

  return [...buckets.entries()].map(([label, count]) => ({ label, count }))
}
