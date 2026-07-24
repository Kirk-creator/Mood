import { useMemo, useState, type CSSProperties } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  activityFrequency,
  type FlatActivity,
  type FrequencyGranularity,
} from '../chartUtils'
import type { CheckIn } from '../types'

interface ActivityFrequencyProps {
  /** Check-ins already limited to the selected date range */
  checkIns: CheckIn[]
  activities: FlatActivity[]
}

const GRANULARITIES: Array<[FrequencyGranularity, string]> = [
  ['hour', 'Hour of day'],
  ['weekday', 'Day of week'],
  ['date', 'By date'],
]

export function ActivityFrequency({ checkIns, activities }: ActivityFrequencyProps) {
  const [granularity, setGranularity] = useState<FrequencyGranularity>('hour')
  const [selectedId, setSelectedId] = useState<string>('all')

  const selected = activities.find((a) => a.id === selectedId) ?? null
  const activityIds = useMemo(
    () =>
      selected
        ? new Set([selected.id])
        : new Set(activities.map((a) => a.id)),
    [selected, activities],
  )

  const data = useMemo(
    () => activityFrequency(checkIns, granularity, activityIds),
    [checkIns, granularity, activityIds],
  )

  const total = data.reduce((sum, bucket) => sum + bucket.count, 0)
  const barColor = selected?.color ?? '#1f6f5b'

  return (
    <section className="frequency">
      <header className="panel-header">
        <div>
          <h2>Activity frequency</h2>
          <p>How often activities are logged, grouped by time.</p>
        </div>
      </header>

      {activities.length === 0 ? (
        <div className="chart-shell">
          <div className="empty-state">
            <p>Add activities on a check-in card to see how often they happen.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="filters">
            <div className="filter-group">
              <span className="filter-label">Activity</span>
              <div className="chip-row">
                <button
                  type="button"
                  className={`chip ${selectedId === 'all' ? 'is-active' : ''}`}
                  onClick={() => setSelectedId('all')}
                  aria-pressed={selectedId === 'all'}
                >
                  All activities
                </button>
                {activities.map((act) => (
                  <button
                    key={act.id}
                    type="button"
                    className={`chip ${selectedId === act.id ? 'is-active' : ''}`}
                    style={
                      selectedId === act.id
                        ? ({ '--chip-accent': act.color } as CSSProperties)
                        : undefined
                    }
                    onClick={() => setSelectedId(act.id)}
                    aria-pressed={selectedId === act.id}
                  >
                    <span
                      className="chip-dot"
                      style={{ background: act.color }}
                      aria-hidden
                    />
                    {act.categoryLabel}: {act.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <span className="filter-label">Group by</span>
              <div className="chip-row">
                {GRANULARITIES.map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    className={`chip ${granularity === key ? 'is-active' : ''}`}
                    onClick={() => setGranularity(key)}
                    aria-pressed={granularity === key}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="chart-shell">
            {total === 0 ? (
              <div className="empty-state">
                <p>
                  {selected
                    ? `“${selected.label}” has not been logged in this date range.`
                    : 'No activities logged in this date range.'}
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid
                    stroke="rgba(28, 42, 38, 0.08)"
                    strokeDasharray="4 6"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: '#5a6b64', fontSize: 11 }}
                    tickMargin={8}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: '#5a6b64', fontSize: 11 }}
                    width={32}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(31, 111, 91, 0.07)' }}
                    contentStyle={{
                      background: '#f7faf8',
                      border: '1px solid rgba(28, 42, 38, 0.12)',
                      borderRadius: 12,
                      boxShadow: '0 8px 24px rgba(20, 40, 32, 0.08)',
                    }}
                  />
                  <Bar
                    dataKey="count"
                    name={selected ? selected.label : 'All activities'}
                    fill={barColor}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={44}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <p className="chart-meta">
            {total} log{total === 1 ? '' : 's'}
            {selected ? ` of ${selected.label}` : ' across all activities'}
          </p>
        </>
      )}
    </section>
  )
}
