import { format, isWithinInterval, parseISO, startOfDay, endOfDay, subDays } from 'date-fns'
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import type {
  ActivityTag,
  CategoryConfig,
  CheckIn,
  DateRangeFilter,
  DateRangePreset,
} from '../types'

interface DashboardProps {
  checkIns: CheckIn[]
  categories: CategoryConfig[]
}

interface FlatActivity {
  categoryId: string
  categoryLabel: string
  color: string
  tag: ActivityTag
}

const ACTIVITY_Y_KEY = '__activityY'

function resolveRange(filter: DateRangeFilter): { start: Date; end: Date } | null {
  const now = new Date()
  if (filter.preset === 'all') return null
  if (filter.preset === 'custom') {
    if (!filter.start || !filter.end) return null
    return {
      start: startOfDay(parseISO(filter.start)),
      end: endOfDay(parseISO(filter.end)),
    }
  }
  const days = filter.preset === '7d' ? 7 : filter.preset === '30d' ? 30 : 90
  return { start: startOfDay(subDays(now, days - 1)), end: endOfDay(now) }
}

/** Prefer Mood rating for activity Y; fall back so dots still render. */
function activityYForCheckIn(
  checkIn: CheckIn,
  categories: CategoryConfig[],
  activityCategoryId: string,
): number {
  const moodCat =
    categories.find((c) => c.id === 'mood') ??
    categories.find((c) => c.label.trim().toLowerCase() === 'mood')

  const moodValue = moodCat ? checkIn.entries[moodCat.id]?.value : null
  if (typeof moodValue === 'number') return moodValue

  const ownValue = checkIn.entries[activityCategoryId]?.value
  if (typeof ownValue === 'number') return ownValue

  // Mid-scale marker so the activity is still visible on the chart
  return 5.5
}

export function Dashboard({ checkIns, categories }: DashboardProps) {
  const scaleCategories = useMemo(
    () => categories.filter((c) => c.hasScale),
    [categories],
  )

  const [visibleCats, setVisibleCats] = useState<Record<string, boolean>>({})
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null)
  const [dateFilter, setDateFilter] = useState<DateRangeFilter>({
    preset: '30d',
    start: null,
    end: null,
  })

  const allActivities: FlatActivity[] = useMemo(
    () =>
      categories.flatMap((c) =>
        c.activities.map((tag) => ({
          categoryId: c.id,
          categoryLabel: c.label,
          color: c.color,
          tag,
        })),
      ),
    [categories],
  )

  const selectedActivity =
    allActivities.find((a) => a.tag.id === selectedActivityId) ?? null

  useEffect(() => {
    if (selectedActivityId && !allActivities.some((a) => a.tag.id === selectedActivityId)) {
      setSelectedActivityId(null)
    }
  }, [selectedActivityId, allActivities])

  const filtered = useMemo(() => {
    const range = resolveRange(dateFilter)
    const chronological = [...checkIns].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    )
    if (!range) return chronological
    return chronological.filter((c) => {
      const t = parseISO(c.timestamp)
      return isWithinInterval(t, range)
    })
  }, [checkIns, dateFilter])

  const chartData = useMemo(() => {
    return filtered.map((c) => {
      const row: Record<string, string | number | null> = {
        id: c.id,
        label: format(parseISO(c.timestamp), 'MMM d · HH:mm'),
      }
      for (const cat of scaleCategories) {
        row[cat.id] = c.entries[cat.id]?.value ?? null
      }

      if (selectedActivity) {
        const entry = c.entries[selectedActivity.categoryId]
        const hasActivity = entry?.activityIds.includes(selectedActivity.tag.id)
        row[ACTIVITY_Y_KEY] = hasActivity
          ? activityYForCheckIn(c, categories, selectedActivity.categoryId)
          : null
      } else {
        row[ACTIVITY_Y_KEY] = null
      }

      return row
    })
  }, [filtered, scaleCategories, selectedActivity, categories])

  const activityPointCount = useMemo(
    () => chartData.filter((row) => row[ACTIVITY_Y_KEY] !== null).length,
    [chartData],
  )

  function setPreset(preset: DateRangePreset) {
    setDateFilter((prev) => ({ ...prev, preset }))
  }

  function isCatVisible(id: string) {
    return visibleCats[id] !== false
  }

  const activeCatCount = scaleCategories.filter((c) => isCatVisible(c.id)).length
  const hasVisibleContent = activeCatCount > 0 || selectedActivity !== null
  const hasPoints =
    chartData.length > 0 && (activeCatCount > 0 || activityPointCount > 0)

  return (
    <section className="dashboard">
      <header className="panel-header">
        <div>
          <h2>Trends</h2>
          <p>
            Compare category ratings over time. Pick one activity to mark as dots
            along the Mood line.
          </p>
        </div>
      </header>

      <div className="filters">
        <div className="filter-group">
          <span className="filter-label">Category ratings</span>
          {scaleCategories.length === 0 ? (
            <p className="filter-hint">
              No categories have a 1–10 scale enabled. Turn scales on in Settings.
            </p>
          ) : (
            <div className="chip-row">
              {scaleCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`chip ${isCatVisible(cat.id) ? 'is-active' : ''}`}
                  style={
                    isCatVisible(cat.id)
                      ? ({ '--chip-accent': cat.color } as CSSProperties)
                      : undefined
                  }
                  onClick={() =>
                    setVisibleCats((prev) => ({
                      ...prev,
                      [cat.id]: !isCatVisible(cat.id),
                    }))
                  }
                  aria-pressed={isCatVisible(cat.id)}
                >
                  <span
                    className="chip-dot"
                    style={{ background: cat.color }}
                    aria-hidden
                  />
                  {cat.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="filter-group">
          <span className="filter-label">Activity on Mood line</span>
          {allActivities.length === 0 ? (
            <p className="filter-hint">
              Add activities on a check-in card or in Settings to plot them here.
            </p>
          ) : (
            <div className="chip-row">
              <button
                type="button"
                className={`chip ${selectedActivityId === null ? 'is-active' : ''}`}
                onClick={() => setSelectedActivityId(null)}
                aria-pressed={selectedActivityId === null}
              >
                None
              </button>
              {allActivities.map((act) => (
                <button
                  key={act.tag.id}
                  type="button"
                  className={`chip chip-event ${selectedActivityId === act.tag.id ? 'is-active' : ''}`}
                  style={
                    selectedActivityId === act.tag.id
                      ? ({ '--chip-accent': act.color } as CSSProperties)
                      : undefined
                  }
                  onClick={() => setSelectedActivityId(act.tag.id)}
                  aria-pressed={selectedActivityId === act.tag.id}
                >
                  <span
                    className="chip-dot chip-dot--diamond"
                    style={{ background: act.color }}
                    aria-hidden
                  />
                  {act.categoryLabel}: {act.tag.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="filter-group">
          <span className="filter-label">Date range</span>
          <div className="chip-row">
            {(
              [
                ['7d', '7 days'],
                ['30d', '30 days'],
                ['90d', '90 days'],
                ['all', 'All time'],
                ['custom', 'Custom'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`chip ${dateFilter.preset === key ? 'is-active' : ''}`}
                onClick={() => setPreset(key)}
                aria-pressed={dateFilter.preset === key}
              >
                {label}
              </button>
            ))}
          </div>
          {dateFilter.preset === 'custom' && (
            <div className="custom-dates">
              <label>
                From
                <input
                  type="date"
                  value={dateFilter.start ?? ''}
                  onChange={(e) =>
                    setDateFilter((prev) => ({
                      ...prev,
                      start: e.target.value || null,
                    }))
                  }
                />
              </label>
              <label>
                To
                <input
                  type="date"
                  value={dateFilter.end ?? ''}
                  onChange={(e) =>
                    setDateFilter((prev) => ({
                      ...prev,
                      end: e.target.value || null,
                    }))
                  }
                />
              </label>
            </div>
          )}
        </div>
      </div>

      <div className="chart-shell">
        {!hasVisibleContent || !hasPoints ? (
          <div className="empty-state">
            <p>
              {checkIns.length === 0
                ? 'No check-ins yet. Log your first entry to see trends.'
                : !hasVisibleContent
                  ? 'Select a category rating or one activity to plot.'
                  : selectedActivity && activityPointCount === 0 && activeCatCount === 0
                    ? 'That activity has not been logged in this date range yet.'
                    : 'No check-ins in this date range.'}
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={380}>
            <ComposedChart data={chartData} margin={{ top: 12, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid stroke="rgba(28, 42, 38, 0.08)" strokeDasharray="4 6" />
              <XAxis
                dataKey="label"
                type="category"
                allowDuplicatedCategory
                tick={{ fill: '#5a6b64', fontSize: 11 }}
                tickMargin={8}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[1, 10]}
                ticks={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
                tick={{ fill: '#5a6b64', fontSize: 11 }}
                width={32}
              />
              <ZAxis range={[90, 90]} />
              <Tooltip
                contentStyle={{
                  background: '#f7faf8',
                  border: '1px solid rgba(28, 42, 38, 0.12)',
                  borderRadius: 12,
                  boxShadow: '0 8px 24px rgba(20, 40, 32, 0.08)',
                }}
              />
              <Legend />
              {scaleCategories.map((cat) =>
                isCatVisible(cat.id) ? (
                  <Line
                    key={cat.id}
                    type="monotone"
                    dataKey={cat.id}
                    name={cat.label}
                    stroke={cat.color}
                    strokeWidth={2.5}
                    dot={{ r: 3.5, strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                ) : null,
              )}
              {selectedActivity ? (
                <Scatter
                  name={`${selectedActivity.categoryLabel}: ${selectedActivity.tag.label}`}
                  dataKey={ACTIVITY_Y_KEY}
                  fill={selectedActivity.color}
                  stroke="#fff"
                  strokeWidth={1}
                  shape="diamond"
                  legendType="diamond"
                />
              ) : null}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      <p className="chart-meta">
        Showing {filtered.length} check-in{filtered.length === 1 ? '' : 's'}
        {activeCatCount > 0
          ? ` · ${activeCatCount} categor${activeCatCount === 1 ? 'y' : 'ies'}`
          : ''}
        {selectedActivity
          ? ` · ${selectedActivity.tag.label} (${activityPointCount} point${activityPointCount === 1 ? '' : 's'})`
          : ''}
      </p>
    </section>
  )
}
