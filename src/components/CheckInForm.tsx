import { useEffect, useState, type FormEvent } from 'react'
import confetti from 'canvas-confetti'
import { v4 as uuidv4 } from 'uuid'
import {
  emptyEntries,
  hasAnyData,
  type CategoryConfig,
  type CategoryEntry,
  type CheckIn,
} from '../types'
import { CategorySlider } from './CategorySlider'

interface CheckInFormProps {
  categories: CategoryConfig[]
  onSubmit: (checkIn: CheckIn) => void
  onAddActivity: (categoryId: string, label: string) => string | null
}

function fireConfetti() {
  const count = 140
  const defaults = { origin: { y: 0.7 }, zIndex: 1000 }

  confetti({
    ...defaults,
    particleCount: Math.floor(count * 0.45),
    spread: 68,
    startVelocity: 42,
    colors: ['#2a9d8f', '#e76f51', '#457b9d', '#c9a227', '#ef476f'],
  })
  confetti({
    ...defaults,
    particleCount: Math.floor(count * 0.3),
    angle: 60,
    spread: 55,
    origin: { x: 0, y: 0.75 },
  })
  confetti({
    ...defaults,
    particleCount: Math.floor(count * 0.3),
    angle: 120,
    spread: 55,
    origin: { x: 1, y: 0.75 },
  })
}

export function CheckInForm({
  categories,
  onSubmit,
  onAddActivity,
}: CheckInFormProps) {
  const [entries, setEntries] = useState(() => emptyEntries(categories))
  const [notes, setNotes] = useState('')
  const [savedFlash, setSavedFlash] = useState(false)

  useEffect(() => {
    setEntries((prev) => {
      const next = emptyEntries(categories)
      for (const cat of categories) {
        if (prev[cat.id]) next[cat.id] = prev[cat.id]
      }
      return next
    })
  }, [categories])

  function updateEntry(id: string, entry: CategoryEntry) {
    setEntries((prev) => ({ ...prev, [id]: entry }))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!hasAnyData(entries, notes)) return

    const clean: Record<string, CategoryEntry> = {}
    for (const cat of categories) {
      const entry = entries[cat.id] ?? emptyEntryFallback()
      const validActivityIds = entry.activityIds.filter((id) =>
        cat.activities.some((t) => t.id === id),
      )
      const value = cat.hasScale ? entry.value : null
      if (value === null && validActivityIds.length === 0) continue
      clean[cat.id] = { value, activityIds: validActivityIds }
    }

    onSubmit({
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      notes: notes.trim(),
      entries: clean,
    })

    fireConfetti()
    setEntries(emptyEntries(categories))
    setNotes('')
    setSavedFlash(true)
    window.setTimeout(() => setSavedFlash(false), 1800)
  }

  const canSubmit = hasAnyData(entries, notes)

  return (
    <form className="checkin-form" onSubmit={handleSubmit}>
      <header className="panel-header">
        <div>
          <h2>New check-in</h2>
          <p>
            Rate categories with a 1–10 scale, add activities, and save when you
            have something to log.
          </p>
        </div>
        {savedFlash && (
          <span className="save-toast" role="status">
            Saved
          </span>
        )}
      </header>

      <div className="category-stack">
        {categories.map((cat) => (
          <CategorySlider
            key={cat.id}
            category={cat}
            entry={entries[cat.id] ?? emptyEntryFallback()}
            onChange={(entry) => updateEntry(cat.id, entry)}
            onAddActivity={onAddActivity}
          />
        ))}
      </div>

      <label className="notes-field checkin-notes">
        <span>Notes</span>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything else about this check-in…"
        />
      </label>

      <div className="form-actions">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            setEntries(emptyEntries(categories))
            setNotes('')
          }}
        >
          Reset
        </button>
        <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
          Save check-in
        </button>
      </div>
    </form>
  )
}

function emptyEntryFallback(): CategoryEntry {
  return { value: null, activityIds: [] }
}
