import { STORAGE_KEY } from './constants'
import type { CheckIn } from './types'

function isCheckIn(value: unknown): value is CheckIn {
  if (!value || typeof value !== 'object') return false
  const item = value as CheckIn
  return (
    typeof item.id === 'string' &&
    typeof item.timestamp === 'string' &&
    typeof item.ratings === 'object' &&
    item.ratings !== null
  )
}

export function loadCheckIns(): CheckIn[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isCheckIn).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
  } catch {
    return []
  }
}

export function saveCheckIns(checkIns: CheckIn[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(checkIns))
}

export function createCheckIn(checkIn: CheckIn): CheckIn[] {
  const next = [checkIn, ...loadCheckIns()]
  saveCheckIns(next)
  return next
}

export function updateCheckIn(updated: CheckIn): CheckIn[] {
  const next = loadCheckIns().map((item) =>
    item.id === updated.id ? updated : item,
  )
  saveCheckIns(next)
  return next
}

export function deleteCheckIn(id: string): CheckIn[] {
  const next = loadCheckIns().filter((item) => item.id !== id)
  saveCheckIns(next)
  return next
}
