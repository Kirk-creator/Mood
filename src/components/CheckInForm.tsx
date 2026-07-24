import { useEffect, useState, type FormEvent } from 'react'
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
}

export function CheckInForm({ categories, onSubmit }: CheckInFormProps) {
  const [entries, setEntries] = useState(() => emptyEntries(categories))
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
    if (!hasAnyData(entries)) return

    const clean: Record<string, CategoryEntry> = {}
    for (const cat of categories) {
      const entry = entries[cat.id] ?? emptyEntries(categories)[cat.id]
      const validEventIds = entry.eventIds.filter((id) =>
        cat.eventTags.some((t) => t.id === id),
      )
      if (entry.value === null && validEventIds.length === 0 && !entry.notes.trim()) {
        continue
      }
      clean[cat.id] = {
        value: entry.value,
        notes: entry.notes.trim(),
        eventIds: validEventIds,
      }
    }

    onSubmit({
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      entries: clean,
    })

    setEntries(emptyEntries(categories))
    setSavedFlash(true)
    window.setTimeout(() => setSavedFlash(false), 1800)
  }

  const canSubmit = hasAnyData(entries)

  return (
    <form className="checkin-form" onSubmit={handleSubmit}>
      <header className="panel-header">
        <div>
          <h2>New check-in</h2>
          <p>
            Rate what matters, tap custom events, skip the rest. Add event buttons
            in Settings.
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
            entry={entries[cat.id] ?? { value: null, notes: '', eventIds: [] }}
            onChange={(entry) => updateEntry(cat.id, entry)}
          />
        ))}
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setEntries(emptyEntries(categories))}
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
