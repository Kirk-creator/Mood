import { format, isWithinInterval, parseISO, startOfDay, endOfDay, subDays } from 'date-fns'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useMemo, useState, type CSSProperties } from 'react'
import { CATEGORIES } from '../constants'
import type {
  CategoryKey,
  CheckIn,
  DateRangeFilter,
  DateRangePreset,
} from '../types'

interface DashboardProps {
  checkIns: CheckIn[]
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

export function Dashboard({ checkIns }: DashboardProps) {
  const [visible, setVisible] = useState<Record<CategoryKey, boolean>>({
    mood: true,
    exercise: true,
    wellbeing: true,
    energy: true,
  })
  const [dateFilter, setDateFilter] = useState<DateRangeFilter>({
    preset: '30d',
    start: null,
    end: null,
  })

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

  const chartData = useMemo(
    () =>
      filtered.map((c) => ({
        id: c.id,
        label: format(parseISO(c.timestamp), 'MMM d · HH:mm'),
        mood: c.ratings.mood.value,
        exercise: c.ratings.exercise.value,
        wellbeing: c.ratings.wellbeing.value,
        energy: c.ratings.energy.value,
      })),
    [filtered],
  )

  function setPreset(preset: DateRangePreset) {
    setDateFilter((prev) => ({ ...prev, preset }))
  }

  const activeCount = CATEGORIES.filter((c) => visible[c.key]).length

  return (
    <section className="dashboard">
      <header className="panel-header">
        <div>
          <h2>Trends</h2>
          <p>Compare categories over time to spot correlations.</p>
        </div>
      </header>

      <div className="filters">
        <div className="filter-group">
          <span className="filter-label">Categories</span>
          <div className="chip-row">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                className={`chip ${visible[cat.key] ? 'is-active' : ''}`}
                style={
                  visible[cat.key]
                    ? ({ '--chip-accent': cat.color } as CSSProperties)
                    : undefined
                }
                onClick={() =>
                  setVisible((prev) => ({ ...prev, [cat.key]: !prev[cat.key] }))
                }
                aria-pressed={visible[cat.key]}
              >
                <span
                  className="chip-dot"
                  style={{ background: cat.color }}
                  aria-hidden
                />
                {cat.shortLabel}
              </button>
            ))}
          </div>
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
        {chartData.length === 0 || activeCount === 0 ? (
          <div className="empty-state">
            <p>
              {checkIns.length === 0
                ? 'No check-ins yet. Log your first entry to see trends.'
                : activeCount === 0
                  ? 'Select at least one category to plot.'
                  : 'No check-ins in this date range.'}
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={360}>
            <LineChart data={chartData} margin={{ top: 12, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid stroke="rgba(28, 42, 38, 0.08)" strokeDasharray="4 6" />
              <XAxis
                dataKey="label"
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
              <Tooltip
                contentStyle={{
                  background: '#f7faf8',
                  border: '1px solid rgba(28, 42, 38, 0.12)',
                  borderRadius: 12,
                  boxShadow: '0 8px 24px rgba(20, 40, 32, 0.08)',
                }}
              />
              <Legend />
              {CATEGORIES.map((cat) =>
                visible[cat.key] ? (
                  <Line
                    key={cat.key}
                    type="monotone"
                    dataKey={cat.key}
                    name={cat.shortLabel}
                    stroke={getComputedColor(cat.key)}
                    strokeWidth={2.5}
                    dot={{ r: 3.5, strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                ) : null,
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <p className="chart-meta">
        Showing {filtered.length} check-in{filtered.length === 1 ? '' : 's'}
        {activeCount > 0 ? ` · ${activeCount} categor${activeCount === 1 ? 'y' : 'ies'}` : ''}
      </p>
    </section>
  )
}

/** Resolve CSS variable colors for Recharts (needs concrete color strings). */
function getComputedColor(key: CategoryKey): string {
  const map: Record<CategoryKey, string> = {
    mood: '#2a9d8f',
    exercise: '#e76f51',
    wellbeing: '#457b9d',
    energy: '#e9c46a',
  }
  return map[key]
}
