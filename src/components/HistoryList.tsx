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
}

export function HistoryList({
  checkIns,
  categories,
  onUpdate,
  onDelete,
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
                  const hasContent =
                    entry.value !== null ||
                    entry.eventIds.length > 0 ||
                    entry.notes.trim()
                  if (!hasContent) return null
                  const eventLabels = entry.eventIds
                    .map((id) => cat.eventTags.find((t) => t.id === id)?.label)
                    .filter(Boolean)
                  return (
                    <div key={cat.id} className="history-rating">
                      <span
                        className="chip-dot"
                        style={{ background: cat.color }}
                        aria-hidden
                      />
                      <span className="history-rating__label">{cat.label}</span>
                      <strong>{entry.value ?? '—'}</strong>
                      <span className="history-rating__notes">
                        {eventLabels.length > 0 && (
                          <span className="history-events">
                            {eventLabels.join(' · ')}
                          </span>
                        )}
                        {entry.notes ? (
                          <span title={entry.notes}>
                            {eventLabels.length > 0 ? ' — ' : ''}
                            {entry.notes}
                          </span>
                        ) : null}
                      </span>
                    </div>
                  )
                })}
                {/* Orphaned entries from removed categories */}
                {Object.entries(item.entries)
                  .filter(([id]) => !categoryMap[id])
                  .map(([id, entry]) => (
                    <div key={id} className="history-rating">
                      <span className="chip-dot" aria-hidden />
                      <span className="history-rating__label">{id}</span>
                      <strong>{entry.value ?? '—'}</strong>
                    </div>
                  ))}
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <EditModal
          checkIn={editing}
          categories={categories}
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
  onClose: () => void
  onSave: (checkIn: CheckIn) => void
}

function EditModal({ checkIn, categories, onClose, onSave }: EditModalProps) {
  const [timestamp, setTimestamp] = useState(
    format(parseISO(checkIn.timestamp), "yyyy-MM-dd'T'HH:mm"),
  )
  const [entries, setEntries] = useState<Record<string, CategoryEntry>>(() => {
    const base = emptyEntries(categories)
    for (const cat of categories) {
      if (checkIn.entries[cat.id]) {
        base[cat.id] = structuredClone(checkIn.entries[cat.id])
      }
    }
    return base
  })

  function updateEntry(id: string, entry: CategoryEntry) {
    setEntries((prev) => ({ ...prev, [id]: entry }))
  }

  function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!hasAnyData(entries)) return

    const clean: Record<string, CategoryEntry> = {}
    for (const cat of categories) {
      const entry = entries[cat.id]
      if (!entry) continue
      const validEventIds = entry.eventIds.filter((id) =>
        cat.eventTags.some((t) => t.id === id),
      )
      if (
        entry.value === null &&
        validEventIds.length === 0 &&
        !entry.notes.trim()
      ) {
        continue
      }
      clean[cat.id] = {
        value: entry.value,
        notes: entry.notes.trim(),
        eventIds: validEventIds,
      }
    }

    onSave({
      ...checkIn,
      timestamp: new Date(timestamp).toISOString(),
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
                entry={entries[cat.id] ?? { value: null, notes: '', eventIds: [] }}
                onChange={(entry) => updateEntry(cat.id, entry)}
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
              disabled={!hasAnyData(entries)}
            >
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
