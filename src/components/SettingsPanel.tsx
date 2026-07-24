import { useState, type FormEvent } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { nextActivityColor } from '../chartUtils'
import type { ActivityTag, AppSettings, CategoryConfig } from '../types'

interface SettingsPanelProps {
  settings: AppSettings
  onChange: (settings: AppSettings) => void
}

const NEW_CATEGORY_COLORS = [
  '#2a9d8f',
  '#e76f51',
  '#457b9d',
  '#c9a227',
  '#9b5de5',
  '#ef476f',
  '#00bbf9',
  '#90be6d',
]

export function SettingsPanel({ settings, onChange }: SettingsPanelProps) {
  const [newActivityLabel, setNewActivityLabel] = useState<Record<string, string>>(
    {},
  )
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('#2a9d8f')
  const [newCategoryHasScale, setNewCategoryHasScale] = useState(true)

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

  function setHasScale(id: string, hasScale: boolean) {
    updateCategories(
      settings.categories.map((c) => (c.id === id ? { ...c, hasScale } : c)),
    )
  }

  function removeCategory(id: string, label: string) {
    if (settings.categories.length <= 1) {
      window.alert('Keep at least one category.')
      return
    }
    if (!window.confirm(`Remove category “${label}”? Past check-ins keep their data.`)) {
      return
    }
    updateCategories(settings.categories.filter((c) => c.id !== id))
  }

  function addCategory(e: FormEvent) {
    e.preventDefault()
    const label = newCategoryName.trim()
    if (!label) return
    const category: CategoryConfig = {
      id: uuidv4(),
      label,
      color: newCategoryColor,
      description: '',
      lowLabel: 'Low',
      highLabel: 'High',
      hasScale: newCategoryHasScale,
      activities: [],
    }
    updateCategories([...settings.categories, category])
    setNewCategoryName('')
    setNewCategoryHasScale(true)
    setNewCategoryColor(
      NEW_CATEGORY_COLORS[
        settings.categories.length % NEW_CATEGORY_COLORS.length
      ],
    )
  }

  function addActivity(categoryId: string, e: FormEvent) {
    e.preventDefault()
    const label = (newActivityLabel[categoryId] ?? '').trim()
    if (!label) return
    const tag: ActivityTag = {
      id: uuidv4(),
      label,
      color: nextActivityColor(
        settings.categories.find((c) => c.id === categoryId)?.activities.length ?? 0,
      ),
    }
    updateCategories(
      settings.categories.map((c) =>
        c.id === categoryId ? { ...c, activities: [...c.activities, tag] } : c,
      ),
    )
    setNewActivityLabel((prev) => ({ ...prev, [categoryId]: '' }))
  }

  function removeActivity(categoryId: string, activityId: string) {
    updateCategories(
      settings.categories.map((c) =>
        c.id === categoryId
          ? { ...c, activities: c.activities.filter((t) => t.id !== activityId) }
          : c,
      ),
    )
  }

  function moveActivity(categoryId: string, index: number, direction: -1 | 1) {
    updateCategories(
      settings.categories.map((c) => {
        if (c.id !== categoryId) return c
        const target = index + direction
        if (target < 0 || target >= c.activities.length) return c
        const activities = [...c.activities]
        ;[activities[index], activities[target]] = [
          activities[target],
          activities[index],
        ]
        return { ...c, activities }
      }),
    )
  }

  function renameActivity(categoryId: string, activityId: string, label: string) {
    updateCategories(
      settings.categories.map((c) =>
        c.id === categoryId
          ? {
              ...c,
              activities: c.activities.map((t) =>
                t.id === activityId ? { ...t, label } : t,
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
            Add or remove categories, toggle 1–10 scales, pick colors, and reorder
            activities.
          </p>
        </div>
      </header>

      <form className="add-category-form" onSubmit={addCategory}>
        <span className="filter-label">Add category</span>
        <div className="add-category-row">
          <label className="color-picker" title="Category color">
            <input
              type="color"
              value={normalizeHex(newCategoryColor)}
              onChange={(e) => setNewCategoryColor(e.target.value)}
              aria-label="New category color"
            />
          </label>
          <input
            className="settings-label-input"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Category name"
            aria-label="New category name"
          />
          <label className="scale-toggle">
            <input
              type="checkbox"
              checked={newCategoryHasScale}
              onChange={(e) => setNewCategoryHasScale(e.target.checked)}
            />
            <span>1–10 scale</span>
          </label>
          <button type="submit" className="btn btn-primary btn-sm">
            Add
          </button>
        </div>
      </form>

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
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => removeCategory(cat.id, cat.label)}
                >
                  Remove
                </button>
              </div>
            </div>

            <label className="scale-toggle scale-toggle--block">
              <input
                type="checkbox"
                checked={cat.hasScale}
                onChange={(e) => setHasScale(cat.id, e.target.checked)}
              />
              <span>Show 1–10 scale</span>
            </label>

            <div className="settings-events">
              <span className="filter-label">Activities</span>
              {cat.activities.length === 0 ? (
                <p className="settings-events__empty">
                  No activities yet — add ones like “sick” or “headache”.
                </p>
              ) : (
                <ul className="settings-event-list">
                  {cat.activities.map((tag, actIndex) => (
                    <li key={tag.id} className="settings-event-row">
                      <span
                        className="chip-dot"
                        style={{ background: tag.color || cat.color }}
                        aria-hidden
                      />
                      <input
                        value={tag.label}
                        onChange={(e) =>
                          renameActivity(cat.id, tag.id, e.target.value)
                        }
                        aria-label="Activity name"
                      />
                      <div className="settings-item__order">
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          disabled={actIndex === 0}
                          onClick={() => moveActivity(cat.id, actIndex, -1)}
                          aria-label={`Move ${tag.label} up`}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          disabled={actIndex === cat.activities.length - 1}
                          onClick={() => moveActivity(cat.id, actIndex, 1)}
                          aria-label={`Move ${tag.label} down`}
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => removeActivity(cat.id, tag.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <form
                className="add-event-form"
                onSubmit={(e) => addActivity(cat.id, e)}
              >
                <input
                  value={newActivityLabel[cat.id] ?? ''}
                  onChange={(e) =>
                    setNewActivityLabel((prev) => ({
                      ...prev,
                      [cat.id]: e.target.value,
                    }))
                  }
                  placeholder="New activity name"
                  aria-label={`Add activity to ${cat.label}`}
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
