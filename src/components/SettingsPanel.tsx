import { useState, type FormEvent } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { AppSettings, CategoryConfig, EventTag } from '../types'

interface SettingsPanelProps {
  settings: AppSettings
  onChange: (settings: AppSettings) => void
}

export function SettingsPanel({ settings, onChange }: SettingsPanelProps) {
  const [newEventLabel, setNewEventLabel] = useState<Record<string, string>>({})

  function updateCategories(categories: CategoryConfig[]) {
    onChange({ ...settings, categories })
  }

  function move(index: number, direction: -1 | 1) {
    const next = [...settings.categories]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    updateCategories(next)
  }

  function setColor(id: string, color: string) {
    updateCategories(
      settings.categories.map((c) => (c.id === id ? { ...c, color } : c)),
    )
  }

  function setLabel(id: string, label: string) {
    updateCategories(
      settings.categories.map((c) => (c.id === id ? { ...c, label } : c)),
    )
  }

  function addEvent(categoryId: string, e: FormEvent) {
    e.preventDefault()
    const label = (newEventLabel[categoryId] ?? '').trim()
    if (!label) return
    const tag: EventTag = { id: uuidv4(), label }
    updateCategories(
      settings.categories.map((c) =>
        c.id === categoryId ? { ...c, eventTags: [...c.eventTags, tag] } : c,
      ),
    )
    setNewEventLabel((prev) => ({ ...prev, [categoryId]: '' }))
  }

  function removeEvent(categoryId: string, eventId: string) {
    updateCategories(
      settings.categories.map((c) =>
        c.id === categoryId
          ? { ...c, eventTags: c.eventTags.filter((t) => t.id !== eventId) }
          : c,
      ),
    )
  }

  function renameEvent(categoryId: string, eventId: string, label: string) {
    updateCategories(
      settings.categories.map((c) =>
        c.id === categoryId
          ? {
              ...c,
              eventTags: c.eventTags.map((t) =>
                t.id === eventId ? { ...t, label } : t,
              ),
            }
          : c,
      ),
    )
  }

  return (
    <section className="settings">
      <header className="panel-header">
        <div>
          <h2>Settings</h2>
          <p>
            Reorder categories, pick colors, and add custom event buttons for each
            category.
          </p>
        </div>
      </header>

      <ul className="settings-list">
        {settings.categories.map((cat, index) => (
          <li key={cat.id} className="settings-item">
            <div className="settings-item__top">
              <div className="settings-item__identity">
                <label className="color-picker" title="Category color">
                  <input
                    type="color"
                    value={normalizeHex(cat.color)}
                    onChange={(e) => setColor(cat.id, e.target.value)}
                    aria-label={`${cat.label} color`}
                  />
                </label>
                <input
                  className="settings-label-input"
                  value={cat.label}
                  onChange={(e) => setLabel(cat.id, e.target.value)}
                  aria-label="Category name"
                />
              </div>
              <div className="settings-item__order">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  aria-label={`Move ${cat.label} up`}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  disabled={index === settings.categories.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label={`Move ${cat.label} down`}
                >
                  ↓
                </button>
              </div>
            </div>

            <div className="settings-events">
              <span className="filter-label">Event buttons</span>
              {cat.eventTags.length === 0 ? (
                <p className="settings-events__empty">
                  No events yet — add ones like “sick” or “headache”.
                </p>
              ) : (
                <ul className="settings-event-list">
                  {cat.eventTags.map((tag) => (
                    <li key={tag.id} className="settings-event-row">
                      <span
                        className="chip-dot"
                        style={{ background: cat.color }}
                        aria-hidden
                      />
                      <input
                        value={tag.label}
                        onChange={(e) =>
                          renameEvent(cat.id, tag.id, e.target.value)
                        }
                        aria-label="Event name"
                      />
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => removeEvent(cat.id, tag.id)}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <form
                className="add-event-form"
                onSubmit={(e) => addEvent(cat.id, e)}
              >
                <input
                  value={newEventLabel[cat.id] ?? ''}
                  onChange={(e) =>
                    setNewEventLabel((prev) => ({
                      ...prev,
                      [cat.id]: e.target.value,
                    }))
                  }
                  placeholder="New event name"
                  aria-label={`Add event to ${cat.label}`}
                />
                <button type="submit" className="btn btn-ghost btn-sm">
                  Add
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function normalizeHex(color: string): string {
  if (/^#[0-9a-fA-F]{6}$/.test(color)) return color
  return '#2a9d8f'
}
