import {
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react'
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
  const [adding, setAdding] = useState(false)
  const [newActivity, setNewActivity] = useState('')
  const inputRef = useRef<HTMLInputElement | null>(null)

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

  function commitActivity() {
    const label = newActivity.trim()
    if (!label || !onAddActivity) {
      setAdding(false)
      setNewActivity('')
      return
    }
    onAddActivity(category.id, label)
    setNewActivity('')
    inputRef.current?.focus()
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      commitActivity()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setAdding(false)
      setNewActivity('')
    }
  }

  return (
    <section className="category-card" data-category={category.id}>
      <h3 className="category-card__title">
        <span
          className="category-card__swatch"
          style={{ background: category.color }}
          aria-hidden
        />
        {category.label}
      </h3>

      {category.hasScale && (
        <div
          className="scale-bubbles"
          role="group"
          aria-label={`${category.label} rating`}
        >
          <div className="scale-bubbles__hint" aria-hidden>
            <span>{category.lowLabel}</span>
            <span>{category.highLabel}</span>
          </div>
          <div className="scale-bubbles__row">
            {SCALE_VALUES.map((n) => {
              const selected = entry.value === n
              const filled = entry.value !== null && n <= entry.value
              return (
                <button
                  key={n}
                  type="button"
                  className={`scale-bubble ${filled ? 'is-filled' : ''} ${
                    selected ? 'is-selected' : ''
                  }`}
                  style={{ '--bubble-accent': category.color } as CSSProperties}
                  aria-pressed={selected}
                  aria-label={`Rate ${n} (${category.lowLabel} to ${category.highLabel})`}
                  onClick={() => setValue(selected ? null : n)}
                >
                  {n}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="event-tag-row">
        <span className="event-tags__label">Activities</span>
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

        {onAddActivity &&
          (adding ? (
            <span className="event-tag event-tag--input">
              <input
                ref={inputRef}
                autoFocus
                value={newActivity}
                onChange={(e) => setNewActivity(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => {
                  if (!newActivity.trim()) setAdding(false)
                }}
                placeholder="Activity name"
                aria-label={`Add activity to ${category.label}`}
              />
              <button
                type="button"
                className="event-tag__confirm"
                onMouseDown={(e) => e.preventDefault()}
                onClick={commitActivity}
                aria-label="Save activity"
              >
                ✓
              </button>
            </span>
          ) : (
            <button
              type="button"
              className="event-tag event-tag--add"
              onClick={() => setAdding(true)}
              aria-label={`Add activity to ${category.label}`}
            >
              <span aria-hidden>+</span>
            </button>
          ))}
      </div>
    </section>
  )
}
