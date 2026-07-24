export interface EventTag {
  id: string
  label: string
}

export interface CategoryConfig {
  id: string
  label: string
  color: string
  description: string
  lowLabel: string
  highLabel: string
  eventTags: EventTag[]
}

export interface CategoryEntry {
  value: number | null
  notes: string
  eventIds: string[]
}

export interface CheckIn {
  id: string
  timestamp: string
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
  return { value: null, notes: '', eventIds: [] }
}

export function emptyEntries(categories: CategoryConfig[]): Record<string, CategoryEntry> {
  return Object.fromEntries(categories.map((c) => [c.id, emptyEntry()]))
}

export function hasAnyData(entries: Record<string, CategoryEntry>): boolean {
  return Object.values(entries).some(
    (e) => e.value !== null || e.eventIds.length > 0 || e.notes.trim().length > 0,
  )
}

export function sortCategories(categories: CategoryConfig[]): CategoryConfig[] {
  return [...categories]
}
