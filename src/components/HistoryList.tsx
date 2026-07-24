import { format, parseISO } from 'date-fns'
import { useState, type FormEvent } from 'react'
import { CATEGORIES } from '../constants'
import {
  emptyRatings,
  hasAnyRating,
  type CheckIn,
  type CheckInRatings,
  type CategoryKey,
} from '../types'
import { CategorySlider } from './CategorySlider'

interface HistoryListProps {
  checkIns: CheckIn[]
  onUpdate: (checkIn: CheckIn) => void
  onDelete: (id: string) => void
}

export function HistoryList({ checkIns, onUpdate, onDelete }: HistoryListProps) {
  const [editing, setEditing] = useState<CheckIn | null>(null)

  return (
    <section className="history">
      <header className="panel-header">
        <div>
          <h2>History</h2>
          <p>Review, edit, or delete past check-ins.</p>
        </div>
      </header>

      {checkIns.length === 0 ? (
        <div className="empty-state">
          <p>Your check-ins will appear here.</p>
        </div>
      ) : (
        <ul className="history-list">
          {checkIns.map((item) => (
            <li key={item.id} className="history-item">
              <div className="history-item__top">
                <time dateTime={item.timestamp}>
                  {format(parseISO(item.timestamp), 'EEE, MMM d · h:mm a')}
                </time>
                <div className="history-item__actions">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setEditing(structuredClone(item))}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => {
                      if (window.confirm('Delete this check-in?')) {
                        onDelete(item.id)
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="history-ratings">
                {CATEGORIES.map((cat) => {
                  const r = item.ratings[cat.key]
                  return (
                    <div key={cat.key} className="history-rating">
                      <span
                        className="chip-dot"
                        style={{ background: cat.color }}
                        aria-hidden
                      />
                      <span className="history-rating__label">{cat.shortLabel}</span>
                      <strong>{r.value ?? '—'}</strong>
                      {r.value !== null && r.notes ? (
                        <span className="history-rating__notes" title={r.notes}>
                          {r.notes}
                        </span>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <EditModal
          checkIn={editing}
          onClose={() => setEditing(null)}
          onSave={(next) => {
            onUpdate(next)
            setEditing(null)
          }}
        />
      )}
    </section>
  )
}

interface EditModalProps {
  checkIn: CheckIn
  onClose: () => void
  onSave: (checkIn: CheckIn) => void
}

function EditModal({ checkIn, onClose, onSave }: EditModalProps) {
  const [timestamp, setTimestamp] = useState(
    format(parseISO(checkIn.timestamp), "yyyy-MM-dd'T'HH:mm"),
  )
  const [ratings, setRatings] = useState<CheckInRatings>(
    structuredClone(checkIn.ratings),
  )

  function updateCategory(key: CategoryKey, rating: CheckInRatings[CategoryKey]) {
    setRatings((prev) => ({ ...prev, [key]: rating }))
  }

  function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!hasAnyRating(ratings)) return

    const clean = emptyRatings()
    for (const key of Object.keys(ratings) as CategoryKey[]) {
      const r = ratings[key]
      clean[key] =
        r.value === null
          ? { value: null, notes: '' }
          : { value: r.value, notes: r.notes.trim() }
    }

    onSave({
      ...checkIn,
      timestamp: new Date(timestamp).toISOString(),
      ratings: clean,
    })
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal__header">
          <h2 id="edit-title">Edit check-in</h2>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            Close
          </button>
        </header>
        <form onSubmit={handleSave} className="modal__body">
          <label className="timestamp-field">
            <span>Date & time</span>
            <input
              type="datetime-local"
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
              required
            />
          </label>
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
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!hasAnyRating(ratings)}
            >
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
