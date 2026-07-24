export type CategoryKey = 'mood' | 'exercise' | 'wellbeing' | 'energy'

export interface CategoryRating {
  value: number | null
  notes: string
}

export type CheckInRatings = Record<CategoryKey, CategoryRating>

export interface CheckIn {
  id: string
  timestamp: string
  ratings: CheckInRatings
}

export type DateRangePreset = '7d' | '30d' | '90d' | 'all' | 'custom'

export interface DateRangeFilter {
  preset: DateRangePreset
  start: string | null
  end: string | null
}

export function emptyRatings(): CheckInRatings {
  return {
    mood: { value: null, notes: '' },
    exercise: { value: null, notes: '' },
    wellbeing: { value: null, notes: '' },
    energy: { value: null, notes: '' },
  }
}

export function hasAnyRating(ratings: CheckInRatings): boolean {
  return (Object.keys(ratings) as CategoryKey[]).some(
    (key) => ratings[key].value !== null,
  )
}
