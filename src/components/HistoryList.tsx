import { format, parseISO } from 'date-fns'
import { useState, type FormEvent } from 'react'
import {
  emptyEntries,
  hasAnyData,
  type CategoryConfig,
  type CategoryEntry,
  type CheckIn,
} from '../types'
import { CategorySlider } from './CategorySlider'

interface HistoryListProps {
  checkIns: CheckIn[]
  categories: CategoryConfig[]
  onUpdate: (checkIn: CheckIn) => void
  onDelete: (id: string) => void
  onAddActivity: (categoryId: string, label: string) => string | null
}

export function HistoryList({
  checkIns,
  categories,
  onUpdate,
  onDelete,
  onAddActivity,
}: HistoryListProps) {
  const [editing, setEditing] = useState<CheckIn | null>(null)
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]))

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
                {categories.map((cat) => {
                  const entry = item.entries[cat.id]
                  if (!entry) return null
                  const activityLabels = entry.activityIds
                    .map((id) => cat.activities.find((t) => t.id === id)?.label)
                    .filter(Boolean)
                  const showValue = cat.hasScale && entry.value !== null
                  if (!showValue && activityLabels.length === 0) return null
                  return (
                    <div key={cat.id} className="history-rating">
                      <span
                        className="chip-dot"
                        style={{ background: cat.color }}
                        aria-hidden
                      />
                      <span className="history-rating__label">{cat.label}</span>
                      <strong>{showValue ? entry.value : '—'}</strong>
                      {activityLabels.length > 0 ? (
                        <span className="history-rating__notes">
                          <span className="history-events">
                            {activityLabels.join(' · ')}
                          </span>
                        </span>
                      ) : (
                        <span />
                      )}
                    </div>
                  )
                })}
                {Object.entries(item.entries)
                  .filter(([id]) => !categoryMap[id])
                  .map(([id, entry]) => {
                    const hasData =
                      entry.value !== null || entry.activityIds.length > 0
                    if (!hasData) return null
                    const looksLikeId =
                      /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(id) || id.length > 24
                    return (
                      <div key={id} className="history-rating">
                        <span className="chip-dot" aria-hidden />
                        <span className="history-rating__label">
                          {looksLikeId ? 'Former category' : id}
                        </span>
                        <strong>{entry.value ?? '—'}</strong>
                      </div>
                    )
                  })}
              </div>
              {item.notes ? (
                <p className="history-checkin-notes">{item.notes}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <EditModal
          checkIn={editing}
          categories={categories}
          onAddActivity={onAddActivity}
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
  categories: CategoryConfig[]
  onAddActivity: (categoryId: string, label: string) => string | null
  onClose: () => void
  onSave: (checkIn: CheckIn) => void
}

function EditModal({
  checkIn,
  categories,
  onAddActivity,
  onClose,
  onSave,
}: EditModalProps) {
  const [timestamp, setTimestamp] = useState(
    format(parseISO(checkIn.timestamp), "yyyy-MM-dd'T'HH:mm"),
  )
  const [notes, setNotes] = useState(checkIn.notes ?? '')
  const [entries, setEntries] = useState<Record<string, CategoryEntry>>(() => {
    const base = emptyEntries(categories)
    for (const cat of categories) {
      if (checkIn.entries[cat.id]) {
        base[cat.id] = {
          value: checkIn.entries[cat.id].value,
          activityIds: [...checkIn.entries[cat.id].activityIds],
        }
      }
    }
    return base
  })

  function updateEntry(id: string, entry: CategoryEntry) {
    setEntries((prev) => ({ ...prev, [id]: entry }))
  }

  function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!hasAnyData(entries, notes)) return

    const clean: Record<string, CategoryEntry> = {}
    for (const cat of categories) {
      const entry = entries[cat.id]
      if (!entry) continue
      const validActivityIds = entry.activityIds.filter((id) =>
        cat.activities.some((t) => t.id === id),
      )
      const value = cat.hasScale ? entry.value : null
      if (value === null && validActivityIds.length === 0) continue
      clean[cat.id] = { value, activityIds: validActivityIds }
    }

    onSave({
      ...checkIn,
      timestamp: new Date(timestamp).toISOString(),
      notes: notes.trim(),
      entries: clean,
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
            {categories.map((cat) => (
              <CategorySlider
                key={cat.id}
                category={cat}
                entry={entries[cat.id] ?? { value: null, activityIds: [] }}
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
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!hasAnyData(entries, notes)}
            >
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
