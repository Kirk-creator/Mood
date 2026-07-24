import type { CategoryKey } from './types'

export interface CategoryMeta {
  key: CategoryKey
  label: string
  shortLabel: string
  description: string
  color: string
  lowLabel: string
  highLabel: string
}

export const CATEGORIES: CategoryMeta[] = [
  {
    key: 'mood',
    label: 'Mood',
    shortLabel: 'Mood',
    description: 'How you feel emotionally right now',
    color: 'var(--cat-mood)',
    lowLabel: 'Low',
    highLabel: 'Great',
  },
  {
    key: 'exercise',
    label: 'Physical Exercise',
    shortLabel: 'Exercise',
    description: 'How active or exercised you feel today',
    color: 'var(--cat-exercise)',
    lowLabel: 'Sedentary',
    highLabel: 'Very active',
  },
  {
    key: 'wellbeing',
    label: 'Physical Well-being',
    shortLabel: 'Well-being',
    description: 'How your body feels overall',
    color: 'var(--cat-wellbeing)',
    lowLabel: 'Unwell',
    highLabel: 'Vibrant',
  },
  {
    key: 'energy',
    label: 'Energy Level',
    shortLabel: 'Energy',
    description: 'Your current energy and alertness',
    color: 'var(--cat-energy)',
    lowLabel: 'Drained',
    highLabel: 'Energized',
  },
]

export const STORAGE_KEY = 'pulse-checkins-v1'

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c]),
) as Record<CategoryKey, CategoryMeta>
