export interface ActivityTag {
  id: string
  label: string
  /** Distinct color for charts; falls back to a palette hash if missing */
  color?: string
}

export interface CategoryConfig {
  id: string
  label: string
  color: string
  description: string
  lowLabel: string
  highLabel: string
  /** When true, show a 1–10 scale on check-in and plot a rating line */
  hasScale: boolean
  activities: ActivityTag[]
}

export interface CategoryEntry {
  value: number | null
  activityIds: string[]
}

export interface CheckIn {
  id: string
  timestamp: string
  /** Whole check-in notes */
  notes: string
  /** Keyed by category id */
  entries: Record<string, CategoryEntry>
}

export type DateRangePreset = '7d' | '30d' | '90d' | 'all' | 'custom'

export interface DateRangeFilter {
  preset: DateRangePreset
  start: string | null
  end: string | null
}

export interface AppSettings {
  categories: CategoryConfig[]
}

export function emptyEntry(): CategoryEntry {
  return { value: null, activityIds: [] }
}

export function emptyEntries(categories: CategoryConfig[]): Record<string, CategoryEntry> {
  return Object.fromEntries(categories.map((c) => [c.id, emptyEntry()]))
}

export function hasAnyData(
  entries: Record<string, CategoryEntry>,
  notes = '',
): boolean {
  if (notes.trim().length > 0) return true
  return Object.values(entries).some(
    (e) => e.value !== null || e.activityIds.length > 0,
  )
}
