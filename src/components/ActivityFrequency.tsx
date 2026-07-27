import { useMemo, useState, type CSSProperties } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  activityFrequencySeries,
  type FlatActivity,
  type FrequencyGranularity,
} from '../chartUtils'
import type { CheckIn } from '../types'
import { ActivityChipGroups } from './ActivityChipGroups'

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
  /** Activities hidden from the stacked chart; everything else is shown. */
  const [hiddenIds, setHiddenIds] = useState<Record<string, boolean>>({})

  const visibleActivities = useMemo(
    () => activities.filter((a) => !hiddenIds[a.id]),
    [activities, hiddenIds],
  )

  const data = useMemo(
    () =>
      activityFrequencySeries(
        checkIns,
        granularity,
        visibleActivities.map((a) => a.id),
      ),
    [checkIns, granularity, visibleActivities],
  )

  const total = useMemo(() => {
    let sum = 0
    for (const row of data) {
      for (const act of visibleActivities) sum += row[act.id] as number
    }
    return sum
  }, [data, visibleActivities])

  function toggleActivity(id: string) {
    setHiddenIds((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function setGroupVisibility(ids: string[], showAll: boolean) {
    setHiddenIds((prev) => {
      const next = { ...prev }
      for (const id of ids) next[id] = !showAll
      return next
    })
  }

  return (
    <section className="frequency">
      <header className="panel-header">
        <div>
          <h2>Activity frequency</h2>
          <p>
            How often each activity is logged — stacked by color so you can compare
            them at a glance. Open a category to show or hide its activities.
          </p>
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
              <span className="filter-label">Activities by category</span>
              <ActivityChipGroups
                activities={activities}
                initiallyOpenIds={[]}
                groupMeta={(group) => {
                  const shown = group.activities.filter((a) => !hiddenIds[a.id])
                    .length
                  return `${shown}/${group.activities.length}`
                }}
                emptyHint="Add activities on a check-in card to see how often they happen."
                renderChip={(act) => {
                  const active = !hiddenIds[act.id]
                  return (
                    <button
                      key={act.id}
                      type="button"
                      className={`chip ${active ? 'is-active' : ''}`}
                      style={
                        active
                          ? ({ '--chip-accent': act.color } as CSSProperties)
                          : undefined
                      }
                      onClick={() => toggleActivity(act.id)}
                      aria-pressed={active}
                    >
                      <span
                        className="chip-dot"
                        style={{ background: act.color }}
                        aria-hidden
                      />
                      {act.label}
                    </button>
                  )
                }}
                renderGroupActions={(group) => {
                  const ids = group.activities.map((a) => a.id)
                  const allShown = ids.every((id) => !hiddenIds[id])
                  return (
                    <div className="activity-chip-group__actions">
                      <button
                        type="button"
                        className="link-btn"
                        onClick={() => setGroupVisibility(ids, !allShown)}
                      >
                        {allShown ? 'Hide all' : 'Show all'}
                      </button>
                    </div>
                  )
                }}
              />
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
            {visibleActivities.length === 0 || total === 0 ? (
              <div className="empty-state">
                <p>
                  {visibleActivities.length === 0
                    ? 'Select at least one activity to plot.'
                    : 'No selected activities logged in this date range.'}
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
                  <Legend />
                  {visibleActivities.map((act, index) => (
                    <Bar
                      key={act.id}
                      dataKey={act.id}
                      name={`${act.categoryLabel}: ${act.label}`}
                      stackId="activities"
                      fill={act.color}
                      radius={
                        index === visibleActivities.length - 1
                          ? [6, 6, 0, 0]
                          : [0, 0, 0, 0]
                      }
                      maxBarSize={44}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <p className="chart-meta">
            {total} log{total === 1 ? '' : 's'}
            {visibleActivities.length === activities.length
              ? ' across all activities'
              : ` across ${visibleActivities.length} activit${visibleActivities.length === 1 ? 'y' : 'ies'}`}
          </p>
        </>
      )}
    </section>
  )
}
