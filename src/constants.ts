import type { AppSettings, CategoryConfig } from './types'

export const CHECKINS_KEY = 'pulse-checkins-v2'
/** Legacy key — migrated once into v2 */
export const LEGACY_CHECKINS_KEY = 'pulse-checkins-v1'
export const SETTINGS_KEY = 'pulse-settings-v1'

/** Pre-auth stock categories — used to detect accounts that still need slimming. */
export const LEGACY_STOCK_CATEGORY_IDS = [
  'mood',
  'exercise',
  'wellbeing',
  'energy',
  'food',
  'social',
  'health',
  'hobbies',
  'events',
  'sleep',
  'weather',
  'other',
] as const

/** Initial 1–10 scale categories for new accounts. Users can add more in Settings. */
export const DEFAULT_CATEGORIES: CategoryConfig[] = [
  {
    id: 'mood',
    label: 'Mood',
    color: '#2a9d8f',
    description: 'How you feel emotionally',
    lowLabel: 'Low',
    highLabel: 'Great',
    hasScale: true,
    activities: [],
  },
  {
    id: 'energy',
    label: 'Energy',
    color: '#c9a227',
    description: 'Energy and alertness',
    lowLabel: 'Drained',
    highLabel: 'Energized',
    hasScale: true,
    activities: [],
  },
  {
    id: 'health',
    label: 'Health',
    color: '#ef476f',
    description: 'Health symptoms and status',
    lowLabel: 'Struggling',
    highLabel: 'Healthy',
    hasScale: true,
    activities: [],
  },
  {
    id: 'anxiety',
    label: 'Anxiety',
    color: '#7b68ee',
    description: 'Worry and tension',
    lowLabel: 'Calm',
    highLabel: 'Anxious',
    hasScale: true,
    activities: [],
  },
]

export function defaultSettings(): AppSettings {
  return {
    categories: DEFAULT_CATEGORIES.map((c) => ({
      ...c,
      activities: [...c.activities],
    })),
  }
}
