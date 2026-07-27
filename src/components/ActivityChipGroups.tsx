import { useMemo, useState, type ReactNode } from 'react'
import type { FlatActivity } from '../chartUtils'
import '../activityChipGroups.css'

export interface ActivityGroup {
  categoryId: string
  categoryLabel: string
  activities: FlatActivity[]
}

/** Preserve category order from flattenActivities while nesting chips. */
export function groupActivitiesByCategory(
  activities: FlatActivity[],
): ActivityGroup[] {
  const groups: ActivityGroup[] = []
  const indexById = new Map<string, number>()

  for (const act of activities) {
    const existing = indexById.get(act.categoryId)
    if (existing === undefined) {
      indexById.set(act.categoryId, groups.length)
      groups.push({
        categoryId: act.categoryId,
        categoryLabel: act.categoryLabel,
        activities: [act],
      })
    } else {
      groups[existing].activities.push(act)
    }
  }

  return groups
}

interface ActivityChipGroupsProps {
  activities: FlatActivity[]
  /** Category ids that should start expanded (e.g. ones with a selection). */
  initiallyOpenIds?: string[]
  /** Optional badge next to each category name, e.g. "2 selected". */
  groupMeta?: (group: ActivityGroup) => string | null
  renderChip: (activity: FlatActivity) => ReactNode
  emptyHint?: string
  /** Extra controls under the chips inside an open group (Select all, etc.). */
  renderGroupActions?: (group: ActivityGroup) => ReactNode
}

export function ActivityChipGroups({
  activities,
  initiallyOpenIds = [],
  groupMeta,
  renderChip,
  emptyHint = 'No activities yet.',
  renderGroupActions,
}: ActivityChipGroupsProps) {
  const groups = useMemo(
    () => groupActivitiesByCategory(activities),
    [activities],
  )

  const [openIds, setOpenIds] = useState<string[]>(() => {
    const preferred = initiallyOpenIds.filter((id) =>
      groups.some((g) => g.categoryId === id),
    )
    if (preferred.length > 0) return preferred
    return groups.length > 0 ? [groups[0].categoryId] : []
  })

  function toggleOpen(categoryId: string) {
    setOpenIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    )
  }

  if (groups.length === 0) {
    return <p className="filter-hint">{emptyHint}</p>
  }

  return (
    <div className="activity-chip-groups">
      {groups.map((group) => {
        const open = openIds.includes(group.categoryId)
        const meta = groupMeta?.(group) ?? null

        return (
          <section
            key={group.categoryId}
            className={`activity-chip-group ${open ? 'is-open' : ''}`}
          >
            <button
              type="button"
              className="activity-chip-group__head"
              onClick={() => toggleOpen(group.categoryId)}
              aria-expanded={open}
            >
              <span className="activity-chip-group__caret" aria-hidden>
                ▸
              </span>
              <span className="activity-chip-group__name">
                {group.categoryLabel}
              </span>
              <span className="activity-chip-group__count">
                {meta ?? `${group.activities.length}`}
              </span>
            </button>

            {open && (
              <div className="activity-chip-group__body">
                <div className="chip-row">{group.activities.map(renderChip)}</div>
                {renderGroupActions?.(group)}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
