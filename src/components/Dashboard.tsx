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
import { useMemo, useState, type CSSProperties } from 'react'
import type {
  CategoryConfig,
  CheckIn,
  DateRangeFilter,
  DateRangePreset,
  EventTag,
} from '../types'

interface DashboardProps {
  checkIns: CheckIn[]
  categories: CategoryConfig[]
}

interface FlatEvent {
  categoryId: string
  categoryLabel: string
  color: string
  tag: EventTag
}

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

export function Dashboard({ checkIns, categories }: DashboardProps) {
  const [visibleCats, setVisibleCats] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(categories.map((c) => [c.id, true])),
  )
  const [visibleEvents, setVisibleEvents] = useState<Record<string, boolean>>({})
  const [dateFilter, setDateFilter] = useState<DateRangeFilter>({
    preset: '30d',
    start: null,
    end: null,
  })

  // Keep visibility maps in sync when categories/events change
  const allEvents: FlatEvent[] = useMemo(
    () =>
      categories.flatMap((c) =>
        c.eventTags.map((tag) => ({
          categoryId: c.id,
          categoryLabel: c.label,
          color: c.color,
          tag,
        })),
      ),
    [categories],
  )

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
      for (const cat of categories) {
        row[cat.id] = c.entries[cat.id]?.value ?? null
      }
      return row
    })
  }, [filtered, categories])

  /** Scatter points for each event tag: y = category rating or mid-scale marker */
  const eventSeries = useMemo(() => {
    const map: Record<string, Array<{ label: string; y: number; name: string }>> = {}
    for (const ev of allEvents) {
      map[ev.tag.id] = []
    }
    for (const checkIn of filtered) {
      const label = format(parseISO(checkIn.timestamp), 'MMM d · HH:mm')
      for (const ev of allEvents) {
        const entry = checkIn.entries[ev.categoryId]
        if (!entry?.eventIds.includes(ev.tag.id)) continue
        const y = entry.value ?? 5.5
        map[ev.tag.id].push({
          label,
          y,
          name: `${ev.categoryLabel}: ${ev.tag.label}`,
        })
      }
    }
    return map
  }, [filtered, allEvents])

  function setPreset(preset: DateRangePreset) {
    setDateFilter((prev) => ({ ...prev, preset }))
  }

  function isCatVisible(id: string) {
    return visibleCats[id] !== false
  }

  function isEventVisible(id: string) {
    // Default: show events once user has defined them (opt-in via toggle; default on)
    return visibleEvents[id] !== false
  }

  const activeCatCount = categories.filter((c) => isCatVisible(c.id)).length
  const activeEventCount = allEvents.filter((e) => isEventVisible(e.tag.id)).length
  const hasVisibleContent = activeCatCount > 0 || activeEventCount > 0
  const hasPoints =
    chartData.length > 0 &&
    (activeCatCount > 0 ||
      allEvents.some(
        (e) => isEventVisible(e.tag.id) && (eventSeries[e.tag.id]?.length ?? 0) > 0,
      ))

  return (
    <section className="dashboard">
      <header className="panel-header">
        <div>
          <h2>Trends</h2>
          <p>Compare category ratings and custom events over time.</p>
        </div>
      </header>

      <div className="filters">
        <div className="filter-group">
          <span className="filter-label">Category ratings</span>
          <div className="chip-row">
            {categories.map((cat) => (
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
        </div>

        <div className="filter-group">
          <span className="filter-label">Events</span>
          {allEvents.length === 0 ? (
            <p className="filter-hint">
              Add event buttons in Settings (e.g. Health → Sick) to plot them here.
            </p>
          ) : (
            <div className="chip-row">
              {allEvents.map((ev) => (
                <button
                  key={ev.tag.id}
                  type="button"
                  className={`chip chip-event ${isEventVisible(ev.tag.id) ? 'is-active' : ''}`}
                  style={
                    isEventVisible(ev.tag.id)
                      ? ({ '--chip-accent': ev.color } as CSSProperties)
                      : undefined
                  }
                  onClick={() =>
                    setVisibleEvents((prev) => ({
                      ...prev,
                      [ev.tag.id]: !isEventVisible(ev.tag.id),
                    }))
                  }
                  aria-pressed={isEventVisible(ev.tag.id)}
                >
                  <span
                    className="chip-dot chip-dot--diamond"
                    style={{ background: ev.color }}
                    aria-hidden
                  />
                  {ev.categoryLabel}: {ev.tag.label}
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
                  ? 'Select at least one category or event to plot.'
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
              <ZAxis range={[80, 80]} />
              <Tooltip
                contentStyle={{
                  background: '#f7faf8',
                  border: '1px solid rgba(28, 42, 38, 0.12)',
                  borderRadius: 12,
                  boxShadow: '0 8px 24px rgba(20, 40, 32, 0.08)',
                }}
              />
              <Legend />
              {categories.map((cat) =>
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
              {allEvents.map((ev) =>
                isEventVisible(ev.tag.id) && (eventSeries[ev.tag.id]?.length ?? 0) > 0 ? (
                  <Scatter
                    key={ev.tag.id}
                    name={`${ev.categoryLabel}: ${ev.tag.label}`}
                    data={eventSeries[ev.tag.id]}
                    dataKey="y"
                    fill={ev.color}
                    stroke="#fff"
                    strokeWidth={1}
                    shape="diamond"
                    legendType="diamond"
                  />
                ) : null,
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      <p className="chart-meta">
        Showing {filtered.length} check-in{filtered.length === 1 ? '' : 's'}
        {activeCatCount > 0
          ? ` · ${activeCatCount} categor${activeCatCount === 1 ? 'y' : 'ies'}`
          : ''}
        {activeEventCount > 0
          ? ` · ${activeEventCount} event type${activeEventCount === 1 ? '' : 's'}`
          : ''}
      </p>
    </section>
  )
}
