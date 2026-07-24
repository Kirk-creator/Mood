import { useState, type CSSProperties, type FormEvent } from 'react'
import type { CategoryConfig, CategoryEntry } from '../types'

interface CategorySliderProps {
  category: CategoryConfig
  entry: CategoryEntry
  onChange: (entry: CategoryEntry) => void
  onAddActivity?: (categoryId: string, label: string) => string | null
}

const SCALE_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const

export function CategorySlider({
  category,
  entry,
  onChange,
  onAddActivity,
}: CategorySliderProps) {
  const [newActivity, setNewActivity] = useState('')

  function setValue(value: number | null) {
    onChange({ ...entry, value })
  }

  function toggleActivity(activityId: string) {
    const has = entry.activityIds.includes(activityId)
    onChange({
      ...entry,
      activityIds: has
        ? entry.activityIds.filter((id) => id !== activityId)
        : [...entry.activityIds, activityId],
    })
  }

  function handleAddActivity(e: FormEvent) {
    e.preventDefault()
    const label = newActivity.trim()
    if (!label || !onAddActivity) return
    const id = onAddActivity(category.id, label)
    if (!id) return
    onChange({
      ...entry,
      activityIds: entry.activityIds.includes(id)
        ? entry.activityIds
        : [...entry.activityIds, id],
    })
    setNewActivity('')
  }

  const hasScale = category.hasScale

  return (
    <section className="category-card" data-category={category.id}>
      <header className="category-card__header">
        <div>
          <h3 className="category-card__title">
            <span
              className="category-card__swatch"
              style={{ background: category.color }}
              aria-hidden
            />
            {category.label}
          </h3>
          {category.description ? (
            <p className="category-card__desc">{category.description}</p>
          ) : null}
        </div>
      </header>

      <div className="category-card__body">
        {hasScale && (
          <div className="scale-bubbles">
            <div className="scale-bubbles__row" role="group" aria-label={`${category.label} rating`}>
              {SCALE_VALUES.map((n) => {
                const active = entry.value === n
                return (
                  <button
                    key={n}
                    type="button"
                    className={`scale-bubble ${active ? 'is-active' : ''}`}
                    style={
                      {
                        '--bubble-accent': category.color,
                      } as CSSProperties
                    }
                    aria-pressed={active}
                    aria-label={`Rate ${n}`}
                    onClick={() => setValue(active ? null : n)}
                  >
                    {n}
                  </button>
                )
              })}
            </div>
            <div className="slider-labels">
              <span>{category.lowLabel}</span>
              <span>{category.highLabel}</span>
            </div>
          </div>
        )}

        <div className="event-tags">
          <span className="event-tags__label">Activities</span>
          <div className="event-tag-row">
            {category.activities.map((tag) => {
              const active = entry.activityIds.includes(tag.id)
              return (
                <button
                  key={tag.id}
                  type="button"
                  className={`event-tag ${active ? 'is-active' : ''}`}
                  style={
                    active
                      ? ({ '--tag-accent': category.color } as CSSProperties)
                      : undefined
                  }
                  aria-pressed={active}
                  onClick={() => toggleActivity(tag.id)}
                >
                  {tag.label}
                </button>
              )
            })}
          </div>
          {onAddActivity && (
            <form className="inline-add-activity" onSubmit={handleAddActivity}>
              <input
                value={newActivity}
                onChange={(e) => setNewActivity(e.target.value)}
                placeholder="Add activity…"
                aria-label={`Add activity to ${category.label}`}
              />
              <button
                type="submit"
                className="btn btn-ghost btn-sm"
                disabled={!newActivity.trim()}
              >
                Add
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
