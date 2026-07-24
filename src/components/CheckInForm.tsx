import { useState, type FormEvent } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { CATEGORIES } from '../constants'
import {
  emptyRatings,
  hasAnyRating,
  type CheckIn,
  type CheckInRatings,
  type CategoryKey,
} from '../types'
import { CategorySlider } from './CategorySlider'

interface CheckInFormProps {
  onSubmit: (checkIn: CheckIn) => void
}

export function CheckInForm({ onSubmit }: CheckInFormProps) {
  const [ratings, setRatings] = useState<CheckInRatings>(emptyRatings)
  const [savedFlash, setSavedFlash] = useState(false)

  function updateCategory(key: CategoryKey, rating: CheckInRatings[CategoryKey]) {
    setRatings((prev) => ({ ...prev, [key]: rating }))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!hasAnyRating(ratings)) return

    const clean: CheckInRatings = emptyRatings()
    for (const key of Object.keys(ratings) as CategoryKey[]) {
      const r = ratings[key]
      clean[key] =
        r.value === null
          ? { value: null, notes: '' }
          : { value: r.value, notes: r.notes.trim() }
    }

    onSubmit({
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      ratings: clean,
    })

    setRatings(emptyRatings())
    setSavedFlash(true)
    window.setTimeout(() => setSavedFlash(false), 1800)
  }

  const canSubmit = hasAnyRating(ratings)

  return (
    <form className="checkin-form" onSubmit={handleSubmit}>
      <header className="panel-header">
        <div>
          <h2>New check-in</h2>
          <p>Log what you want — skip anything that doesn’t apply right now.</p>
        </div>
        {savedFlash && (
          <span className="save-toast" role="status">
            Saved
          </span>
        )}
      </header>

      <div className="category-stack">
        {CATEGORIES.map((cat) => (
          <CategorySlider
            key={cat.key}
            categoryKey={cat.key}
            rating={ratings[cat.key]}
            onChange={(rating) => updateCategory(cat.key, rating)}
          />
        ))}
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setRatings(emptyRatings())}
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
