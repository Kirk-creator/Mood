import type { CSSProperties } from 'react'
import type { CategoryConfig, CategoryEntry } from '../types'

interface CategorySliderProps {
  category: CategoryConfig
  entry: CategoryEntry
  onChange: (entry: CategoryEntry) => void
}

export function CategorySlider({ category, entry, onChange }: CategorySliderProps) {
  const skipped = entry.value === null

  function setValue(value: number | null) {
    onChange({ ...entry, value })
  }

  function setNotes(notes: string) {
    onChange({ ...entry, notes })
  }

  function toggleEvent(eventId: string) {
    const has = entry.eventIds.includes(eventId)
    onChange({
      ...entry,
      eventIds: has
        ? entry.eventIds.filter((id) => id !== eventId)
        : [...entry.eventIds, eventId],
    })
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
        <label className="skip-toggle">
          <input
            type="checkbox"
            checked={skipped}
            onChange={(e) => setValue(e.target.checked ? null : 5)}
          />
          <span>Skip rating</span>
        </label>
      </header>

      <div className={`category-card__body ${skipped ? 'is-skipped-rating' : ''}`}>
        <div className={`slider-row ${skipped ? 'is-disabled' : ''}`}>
          <div className="slider-value" aria-live="polite">
            {skipped ? '—' : entry.value}
          </div>
          <div className="slider-controls">
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              disabled={skipped}
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
            disabled={skipped}
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

        {category.eventTags.length > 0 && (
          <div className="event-tags">
            <span className="event-tags__label">Events</span>
            <div className="event-tag-row">
              {category.eventTags.map((tag) => {
                const active = entry.eventIds.includes(tag.id)
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
                    onClick={() => toggleEvent(tag.id)}
                  >
                    {tag.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <label className="notes-field">
          <span>Notes (optional)</span>
          <textarea
            rows={2}
            value={entry.notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={`Anything about ${category.label.toLowerCase()}…`}
          />
        </label>
      </div>
    </section>
  )
}
