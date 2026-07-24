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
    eventTags: [],
  },
  {
    id: 'exercise',
    label: 'Exercise',
    color: '#e76f51',
    description: 'Physical activity level',
    lowLabel: 'Sedentary',
    highLabel: 'Very active',
    eventTags: [],
  },
  {
    id: 'wellbeing',
    label: 'Well-being',
    color: '#457b9d',
    description: 'How your body feels overall',
    lowLabel: 'Unwell',
    highLabel: 'Vibrant',
    eventTags: [],
  },
  {
    id: 'energy',
    label: 'Energy',
    color: '#c9a227',
    description: 'Energy and alertness',
    lowLabel: 'Drained',
    highLabel: 'Energized',
    eventTags: [],
  },
  {
    id: 'food',
    label: 'Food',
    color: '#d4a373',
    description: 'Eating and nutrition',
    lowLabel: 'Poor',
    highLabel: 'Nourished',
    eventTags: [],
  },
  {
    id: 'social',
    label: 'Social',
    color: '#9b5de5',
    description: 'Connection with others',
    lowLabel: 'Isolated',
    highLabel: 'Connected',
    eventTags: [],
  },
  {
    id: 'health',
    label: 'Health',
    color: '#ef476f',
    description: 'Health symptoms and status',
    lowLabel: 'Struggling',
    highLabel: 'Healthy',
    eventTags: [],
  },
  {
    id: 'hobbies',
    label: 'Hobbies',
    color: '#00bbf9',
    description: 'Leisure and creative time',
    lowLabel: 'None',
    highLabel: 'Engaged',
    eventTags: [],
  },
  {
    id: 'events',
    label: 'Events',
    color: '#f15bb5',
    description: 'Notable things that happened',
    lowLabel: 'Quiet',
    highLabel: 'Busy',
    eventTags: [],
  },
  {
    id: 'sleep',
    label: 'Sleep',
    color: '#4cc9f0',
    description: 'Rest and sleep quality',
    lowLabel: 'Restless',
    highLabel: 'Rested',
    eventTags: [],
  },
  {
    id: 'weather',
    label: 'Weather',
    color: '#90be6d',
    description: 'How weather affected you',
    lowLabel: 'Harsh',
    highLabel: 'Pleasant',
    eventTags: [],
  },
  {
    id: 'other',
    label: 'Other',
    color: '#6c757d',
    description: 'Anything else worth tracking',
    lowLabel: 'Low',
    highLabel: 'High',
    eventTags: [],
  },
]

export function defaultSettings(): AppSettings {
  return { categories: DEFAULT_CATEGORIES.map((c) => ({ ...c, eventTags: [] })) }
}
