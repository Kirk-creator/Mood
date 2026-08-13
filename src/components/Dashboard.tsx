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
import {
  averageCheckInsByDay,
  fillGaps,
  flattenActivities,
} from '../chartUtils'
import { ActivityChipGroups } from './ActivityChipGroups'
import { ActivityInsights } from './ActivityInsights'
import type {
  CategoryConfig,
  CheckIn,
  DateRangeFilter,
  DateRangePreset,
} from '../types'

interface DashboardProps {
  checkIns: CheckIn[]
  categories: CategoryConfig[]
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

/** Dot only for a lone chart value (no second point to draw a line). */
function loneRatingDot(
  catId: string,
  catColor: string,
  rawByCat: Record<string, Array<number | null>>,
) {
  return (props: {
    cx?: number
    cy?: number
    index?: number
  }) => {
    const filled = fillGaps(rawByCat[catId] ?? [])
    const drawn = filled.filter((v) => v !== null).length
    if (drawn !== 1) return null
    const index = props.index ?? -1
    if (index < 0 || filled[index] == null) return null
    if (props.cx == null || props.cy == null) return null
    return (
      <circle
        cx={props.cx}
        cy={props.cy}
        r={5}
        fill={catColor}
        stroke="#fff"
        strokeWidth={1.5}
      />
    )
  }
}

export function Dashboard({ checkIns, categories }: DashboardProps) {
  const scaleCategories = useMemo(
    () => categories.filter((c) => c.hasScale),
    [categories],
  )

  const moodCategory = useMemo(
    () =>
      categories.find((c) => c.id === 'mood') ??
      categories.find((c) => c.label.trim().toLowerCase() === 'mood') ??
      null,
    [categories],
  )

  const [visibleCats, setVisibleCats] = useState<Record<string, boolean>>({})
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null)
  const [dailyAverage, setDailyAverage] = useState(false)
  const [dateFilter, setDateFilter] = useState<DateRangeFilter>({
    preset: '30d',
    start: null,
    end: null,
  })

  const allActivities = useMemo(
    () => flattenActivities(categories),
    [categories],
  )

  const selectedActivity =
    allActivities.find((a) => a.id === selectedActivityId) ?? null

  useEffect(() => {
    if (
      selectedActivityId &&
      !allActivities.some((a) => a.id === selectedActivityId)
    ) {
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

  const dayPoints = useMemo(() => {
    if (!dailyAverage) return null
    return averageCheckInsByDay(
      filtered,
      scaleCategories.map((c) => c.id),
    )
  }, [dailyAverage, filtered, scaleCategories])

  const rawByCat = useMemo(() => {
    const map: Record<string, Array<number | null>> = {}
    for (const cat of scaleCategories) {
      map[cat.id] = dayPoints
        ? dayPoints.map((d) => d.averages[cat.id] ?? null)
        : filtered.map((c) => c.entries[cat.id]?.value ?? null)
    }
    return map
  }, [filtered, scaleCategories, dayPoints])

  const chartData = useMemo(() => {
    if (dayPoints) {
      const rows: Array<Record<string, string | number | boolean | null>> =
        dayPoints.map((d) => ({
          id: d.dayKey,
          label: d.label,
          checkInCount: d.checkInCount,
        }))

      for (const cat of scaleCategories) {
        const filledSeries = fillGaps(rawByCat[cat.id] ?? [])
        filledSeries.forEach((value, i) => {
          rows[i][cat.id] = value
        })
      }

      if (selectedActivity && moodCategory) {
        const moodFilled = fillGaps(rawByCat[moodCategory.id] ?? [])
        dayPoints.forEach((d, i) => {
          const logged = d.activityIds.includes(selectedActivity.id)
          rows[i][ACTIVITY_Y_KEY] = logged ? moodFilled[i] : null
        })
      }

      return rows
    }

    const rows: Array<Record<string, string | number | boolean | null>> =
      filtered.map((c) => ({
        id: c.id,
        label: format(parseISO(c.timestamp), 'MMM d · HH:mm'),
      }))

    for (const cat of scaleCategories) {
      const filledSeries = fillGaps(rawByCat[cat.id] ?? [])
      filledSeries.forEach((value, i) => {
        rows[i][cat.id] = value
      })
    }

    if (selectedActivity && moodCategory) {
      const moodRaw = filtered.map(
        (c) => c.entries[moodCategory.id]?.value ?? null,
      )
      const moodFilled = fillGaps(moodRaw)
      filtered.forEach((c, i) => {
        const entry = c.entries[selectedActivity.categoryId]
        const logged = entry?.activityIds.includes(selectedActivity.id)
        rows[i][ACTIVITY_Y_KEY] = logged ? moodFilled[i] : null
      })
    }

    return rows
  }, [filtered, scaleCategories, selectedActivity, moodCategory, rawByCat, dayPoints])

  const activityPointCount = useMemo(
    () =>
      chartData.filter(
        (row) => row[ACTIVITY_Y_KEY] !== null && row[ACTIVITY_Y_KEY] !== undefined,
      ).length,
    [chartData],
  )

  function setPreset(preset: DateRangePreset) {
    setDateFilter((prev) => ({ ...prev, preset }))
  }

  function isCatVisible(id: string) {
    return visibleCats[id] !== false
  }

  const visibleScaleCats = scaleCategories.filter((c) => isCatVisible(c.id))
  const emptyVisibleCats = visibleScaleCats.filter(
    (cat) => !chartData.some((row) => row[cat.id] != null),
  )
  const catsWithPoints = visibleScaleCats.filter((cat) =>
    chartData.some((row) => row[cat.id] != null),
  )
  const activeCatCount = visibleScaleCats.length
  const hasVisibleContent = activeCatCount > 0 || selectedActivity !== null
  const hasPoints =
    chartData.length > 0 &&
    (catsWithPoints.length > 0 || activityPointCount > 0)

  const categoryFilters = (
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
  )

  const dateFilters = (
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
  )

  const viewFilters = (
    <div className="filter-group">
      <span className="filter-label">Line view</span>
      <div className="chip-row">
        <button
          type="button"
          className={`chip ${!dailyAverage ? 'is-active' : ''}`}
          onClick={() => setDailyAverage(false)}
          aria-pressed={!dailyAverage}
        >
          Each check-in
        </button>
        <button
          type="button"
          className={`chip ${dailyAverage ? 'is-active' : ''}`}
          onClick={() => setDailyAverage(true)}
          aria-pressed={dailyAverage}
        >
          Daily average
        </button>
      </div>
    </div>
  )

  const activityFilters = (
    <div className="filter-group">
      <span className="filter-label">Activity on Mood line</span>
      {allActivities.length === 0 ? (
        <p className="filter-hint">
          Add activities on a check-in card or in Settings to plot them here.
        </p>
      ) : (
        <>
          <div className="chip-row" style={{ marginBottom: '0.35rem' }}>
            <button
              type="button"
              className={`chip ${selectedActivityId === null ? 'is-active' : ''}`}
              onClick={() => setSelectedActivityId(null)}
              aria-pressed={selectedActivityId === null}
            >
              None
            </button>
          </div>
          <ActivityChipGroups
            activities={allActivities}
            initiallyOpenIds={
              selectedActivity ? [selectedActivity.categoryId] : []
            }
            groupMeta={(group) => {
              const selected = group.activities.some(
                (a) => a.id === selectedActivityId,
              )
              return selected
                ? '1 selected'
                : `${group.activities.length}`
            }}
            emptyHint="Add activities on a check-in card or in Settings to plot them here."
            renderChip={(act) => (
              <button
                key={act.id}
                type="button"
                className={`chip chip-event ${selectedActivityId === act.id ? 'is-active' : ''}`}
                style={
                  selectedActivityId === act.id
                    ? ({ '--chip-accent': act.color } as CSSProperties)
                    : undefined
                }
                onClick={() =>
                  setSelectedActivityId((prev) =>
                    prev === act.id ? null : act.id,
                  )
                }
                aria-pressed={selectedActivityId === act.id}
              >
                <span
                  className="chip-dot"
                  style={{ background: act.color }}
                  aria-hidden
                />
                {act.label}
              </button>
            )}
          />
        </>
      )}
    </div>
  )

  return (
    <section className="dashboard">
      <header className="panel-header">
        <div>
          <h2>Trends</h2>
          <p>
            Only categories with a 1–10 scale appear here. Log ratings on
            Check-in to plot them; switch to Daily average to smooth multiple
            check-ins into one point per day. Pick one activity below the graph
            to mark on the Mood line.
          </p>
        </div>
      </header>

      <div className="filters">
        {categoryFilters}
        {dateFilters}
        {viewFilters}
      </div>

      <div className="chart-shell">
        {!hasVisibleContent || !hasPoints ? (
          <div className="empty-state">
            <p>
              {checkIns.length === 0
                ? 'No check-ins yet. Log your first entry to see trends.'
                : !hasVisibleContent
                  ? 'Select a category rating or one activity to plot.'
                  : selectedActivity &&
                      activityPointCount === 0 &&
                      catsWithPoints.length === 0
                    ? moodCategory
                      ? emptyVisibleCats.length > 0
                        ? `${emptyVisibleCats.map((c) => c.label).join(', ')} ${
                            emptyVisibleCats.length === 1 ? 'has' : 'have'
                          } no ratings in this range yet. Log them on Check-in to plot.`
                        : 'That activity has no Mood ratings to sit on in this range.'
                      : 'Add a Mood category to place activity dots.'
                    : emptyVisibleCats.length === activeCatCount &&
                        activityPointCount === 0
                      ? `${emptyVisibleCats.map((c) => c.label).join(', ')} ${
                          emptyVisibleCats.length === 1 ? 'has' : 'have'
                        } no ratings in this range yet. Log them on Check-in to plot.`
                      : 'No check-ins in this date range.'}
            </p>
          </div>
        ) : (
          <>
            {emptyVisibleCats.length > 0 && (
              <p className="filter-hint chart-empty-series" role="status">
                {emptyVisibleCats.map((c) => c.label).join(', ')}{' '}
                {emptyVisibleCats.length === 1 ? 'has' : 'have'} no ratings in
                this range yet — log on Check-in to draw{' '}
                {emptyVisibleCats.length === 1 ? 'that line' : 'those lines'}.
              </p>
            )}
            <ResponsiveContainer width="100%" height={380}>
              <ComposedChart
                data={chartData}
                margin={{ top: 12, right: 16, left: 0, bottom: 8 }}
              >
                <CartesianGrid
                  stroke="rgba(28, 42, 38, 0.08)"
                  strokeDasharray="4 6"
                />
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
                <ZAxis range={[110, 110]} />
                <Tooltip
                  labelFormatter={(label, payload) => {
                    const count = payload?.[0]?.payload?.checkInCount
                    if (dailyAverage && typeof count === 'number') {
                      return `${label} · ${count} check-in${count === 1 ? '' : 's'}`
                    }
                    return String(label)
                  }}
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
                      dot={loneRatingDot(cat.id, cat.color, rawByCat)}
                      activeDot={{ r: 5 }}
                      connectNulls
                    />
                  ) : null,
                )}
                {selectedActivity ? (
                  <Scatter
                    name={`${selectedActivity.categoryLabel}: ${selectedActivity.label}`}
                    dataKey={ACTIVITY_Y_KEY}
                    fill={selectedActivity.color}
                    stroke="#fff"
                    strokeWidth={1.5}
                    shape="circle"
                    legendType="circle"
                  />
                ) : null}
              </ComposedChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      <p className="chart-meta">
        {dailyAverage && dayPoints
          ? `Showing ${dayPoints.length} day${dayPoints.length === 1 ? '' : 's'} · ${filtered.length} check-in${filtered.length === 1 ? '' : 's'} averaged`
          : `Showing ${filtered.length} check-in${filtered.length === 1 ? '' : 's'}`}
        {activeCatCount > 0
          ? ` · ${activeCatCount} categor${activeCatCount === 1 ? 'y' : 'ies'}`
          : ''}
        {selectedActivity
          ? ` · ${selectedActivity.label} (${activityPointCount} point${activityPointCount === 1 ? '' : 's'})`
          : ''}
      </p>

      <div className="filters filters--below-chart">{activityFilters}</div>

      <ActivityInsights checkIns={filtered} activities={allActivities} />
    </section>
  )
}
