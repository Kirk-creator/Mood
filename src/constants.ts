import type { AppSettings, CategoryConfig } from './types'

export const CHECKINS_KEY = 'pulse-checkins-v2'
/** Legacy key — migrated once into v2 */
export const LEGACY_CHECKINS_KEY = 'pulse-checkins-v1'
export const SETTINGS_KEY = 'pulse-settings-v1'

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
    id: 'exercise',
    label: 'Exercise',
    color: '#e76f51',
    description: 'Physical activity level',
    lowLabel: 'Sedentary',
    highLabel: 'Very active',
    hasScale: true,
    activities: [],
  },
  {
    id: 'wellbeing',
    label: 'Well-being',
    color: '#457b9d',
    description: 'How your body feels overall',
    lowLabel: 'Unwell',
    highLabel: 'Vibrant',
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
    id: 'food',
    label: 'Food',
    color: '#d4a373',
    description: 'Eating and nutrition',
    lowLabel: 'Poor',
    highLabel: 'Nourished',
    hasScale: true,
    activities: [],
  },
  {
    id: 'social',
    label: 'Social',
    color: '#9b5de5',
    description: 'Connection with others',
    lowLabel: 'Isolated',
    highLabel: 'Connected',
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
    id: 'hobbies',
    label: 'Hobbies',
    color: '#00bbf9',
    description: 'Leisure and creative time',
    lowLabel: 'None',
    highLabel: 'Engaged',
    hasScale: true,
    activities: [],
  },
  {
    id: 'events',
    label: 'Events',
    color: '#f15bb5',
    description: 'Notable things that happened',
    lowLabel: 'Quiet',
    highLabel: 'Busy',
    hasScale: true,
    activities: [],
  },
  {
    id: 'sleep',
    label: 'Sleep',
    color: '#4cc9f0',
    description: 'Rest and sleep quality',
    lowLabel: 'Restless',
    highLabel: 'Rested',
    hasScale: true,
    activities: [],
  },
  {
    id: 'weather',
    label: 'Weather',
    color: '#90be6d',
    description: 'How weather affected you',
    lowLabel: 'Harsh',
    highLabel: 'Pleasant',
    hasScale: true,
    activities: [],
  },
  {
    id: 'other',
    label: 'Other',
    color: '#6c757d',
    description: 'Anything else worth tracking',
    lowLabel: 'Low',
    highLabel: 'High',
    hasScale: true,
    activities: [],
  },
]

export function defaultSettings(): AppSettings {
  return {
    categories: DEFAULT_CATEGORIES.map((c) => ({
      ...c,
      activities: [],
    })),
  }
}
