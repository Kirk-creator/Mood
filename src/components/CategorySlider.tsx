import type { CSSProperties } from 'react'
import type { CategoryKey, CategoryRating } from '../types'
import { CATEGORY_MAP } from '../constants'

interface CategorySliderProps {
  categoryKey: CategoryKey
  rating: CategoryRating
  onChange: (rating: CategoryRating) => void
}

export function CategorySlider({
  categoryKey,
  rating,
  onChange,
}: CategorySliderProps) {
  const meta = CATEGORY_MAP[categoryKey]
  const skipped = rating.value === null

  function setValue(value: number | null) {
    onChange({ ...rating, value })
  }

  function setNotes(notes: string) {
    onChange({ ...rating, notes })
  }

  return (
    <section className="category-card" data-category={categoryKey}>
      <header className="category-card__header">
        <div>
          <h3 className="category-card__title">
            <span
              className="category-card__swatch"
              style={{ background: meta.color }}
              aria-hidden
            />
            {meta.label}
          </h3>
          <p className="category-card__desc">{meta.description}</p>
        </div>
        <label className="skip-toggle">
          <input
            type="checkbox"
            checked={skipped}
            onChange={(e) => setValue(e.target.checked ? null : 5)}
          />
          <span>Skip</span>
        </label>
      </header>

      <div className={`category-card__body ${skipped ? 'is-skipped' : ''}`}>
        <div className="slider-row">
          <div className="slider-value" aria-live="polite">
            {skipped ? '—' : rating.value}
          </div>
          <div className="slider-controls">
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              disabled={skipped}
              value={rating.value ?? 5}
              onChange={(e) => setValue(Number(e.target.value))}
              aria-label={`${meta.label} rating`}
style={
                  {
                    '--track-color': meta.color,
                  } as CSSProperties
                }
            />
            <div className="slider-labels">
              <span>{meta.lowLabel}</span>
              <span>{meta.highLabel}</span>
            </div>
          </div>
          <input
            type="number"
            className="number-input"
            min={1}
            max={10}
            disabled={skipped}
            value={rating.value ?? ''}
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
            aria-label={`${meta.label} number input`}
          />
        </div>

        <label className="notes-field">
          <span>Notes (optional)</span>
          <textarea
            rows={2}
            disabled={skipped}
            value={rating.notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={`Anything about your ${meta.shortLabel.toLowerCase()}…`}
          />
        </label>
      </div>
    </section>
  )
}
