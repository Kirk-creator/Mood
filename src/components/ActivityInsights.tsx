import { useMemo, type CSSProperties } from 'react'
import {
  activityCooccurrences,
  type FlatActivity,
} from '../chartUtils'
import type { CheckIn } from '../types'
import '../activityInsights.css'

interface ActivityInsightsProps {
  /** Check-ins already limited to the selected date range */
  checkIns: CheckIn[]
  activities: FlatActivity[]
}

export function ActivityInsights({ checkIns, activities }: ActivityInsightsProps) {
  const pairs = useMemo(
    () => activityCooccurrences(checkIns, activities, 6),
    [checkIns, activities],
  )

  const activityCount = useMemo(() => {
    let n = 0
    for (const checkIn of checkIns) {
      for (const entry of Object.values(checkIn.entries)) {
        n += entry.activityIds.length
      }
    }
    return n
  }, [checkIns])

  return (
    <section className="insights">
      <header className="panel-header">
        <div>
          <h2>Together often</h2>
          <p>
            Activities that show up on the same check-in in this date range.
          </p>
        </div>
      </header>

      {activities.length < 2 || activityCount === 0 ? (
        <div className="insights-empty">
          <p>
            {activities.length < 2
              ? 'Add a couple of activities and log them together to see patterns here.'
              : 'No activities logged in this date range yet.'}
          </p>
        </div>
      ) : pairs.length === 0 ? (
        <div className="insights-empty">
          <p>
            Nothing pairs up yet — log two or more activities on the same check-in
            a few times to spot habits.
          </p>
        </div>
      ) : (
        <ul className="insights-list">
          {pairs.map((pair) => (
            <li key={`${pair.left.id}-${pair.right.id}`} className="insights-row">
              <div className="insights-pair">
                <span
                  className="insights-tag"
                  style={{ '--tag-color': pair.left.color } as CSSProperties}
                >
                  <span
                    className="chip-dot"
                    style={{ background: pair.left.color }}
                    aria-hidden
                  />
                  {pair.left.label}
                </span>
                <span className="insights-plus" aria-hidden>
                  +
                </span>
                <span
                  className="insights-tag"
                  style={{ '--tag-color': pair.right.color } as CSSProperties}
                >
                  <span
                    className="chip-dot"
                    style={{ background: pair.right.color }}
                    aria-hidden
                  />
                  {pair.right.label}
                </span>
              </div>
              <p className="insights-meta">
                together {pair.count} time{pair.count === 1 ? '' : 's'}
                {pair.left.categoryLabel !== pair.right.categoryLabel
                  ? ` · ${pair.left.categoryLabel} & ${pair.right.categoryLabel}`
                  : ` · ${pair.left.categoryLabel}`}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
