import type { CSSProperties } from 'react'
import type { CategoryConfig, CategoryEntry } from '../types'

interface CategorySliderProps {
  category: CategoryConfig
  entry: CategoryEntry
  onChange: (entry: CategoryEntry) => void
}

export function CategorySlider({ category, entry, onChange }: CategorySliderProps) {
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

  const hasScale = category.hasScale
  const hasActivities = category.activities.length > 0
  if (!hasScale && !hasActivities) {
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
            <p className="category-card__desc">
              Add activities for this category in Settings, or enable a 1–10 scale.
            </p>
          </div>
        </header>
      </section>
    )
  }

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
          <div className="slider-row">
            <div className="slider-value" aria-live="polite">
              {entry.value ?? '—'}
            </div>
            <div className="slider-controls">
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={entry.value ?? 5}
                onChange={(e) => setValue(Number(e.target.value))}
                aria-label={`${category.label} rating`}
                style={{ '--track-color': category.color } as CSSProperties}
              />
              <div className="slider-labels">
                <span>{category.lowLabel}</span>
                <span>{category.highLabel}</span>
              </div>
            </div>
            <input
              type="number"
              className="number-input"
              min={1}
              max={10}
              value={entry.value ?? ''}
              placeholder="—"
              onChange={(e) => {
                const raw = e.target.value
                if (raw === '') {
                  setValue(null)
                  return
                }
                const n = Number(raw)
                if (Number.isNaN(n)) return
                setValue(Math.min(10, Math.max(1, Math.round(n))))
              }}
              aria-label={`${category.label} number input`}
            />
          </div>
        )}

        {hasActivities && (
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
          </div>
        )}
      </div>
    </section>
  )
}
