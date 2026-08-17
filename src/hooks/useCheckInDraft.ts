import { useCallback, useEffect, useRef, useState } from 'react'
import {
  applyCheckInDraft,
  clearCheckInDraft,
  loadCheckInDraft,
  saveCheckInDraft,
} from '../storage'
import {
  emptyEntries,
  type CategoryConfig,
  type CategoryEntry,
} from '../types'

/**
 * In-progress check-in state that lives outside the form so tab switches,
 * hiding the panel, or remounting CheckInForm cannot wipe it. Writes to
 * localStorage in the same tick as each edit (not in an effect) so a
 * backgrounded tab still has the latest draft if the page is discarded.
 */
export function useCheckInDraft(
  userId: string | null,
  categories: CategoryConfig[],
  active: boolean,
) {
  const [entries, setEntries] = useState(() =>
    active
      ? applyCheckInDraft(categories, loadCheckInDraft(userId)).entries
      : emptyEntries(categories),
  )
  const [notes, setNotes] = useState(() =>
    active ? (loadCheckInDraft(userId)?.notes ?? '') : '',
  )

  const categoriesRef = useRef(categories)
  const entriesRef = useRef(entries)
  const notesRef = useRef(notes)
  const activeRef = useRef(active)
  const userIdRef = useRef(userId)
  categoriesRef.current = categories
  entriesRef.current = entries
  notesRef.current = notes
  activeRef.current = active
  userIdRef.current = userId

  useEffect(() => {
    if (!active) {
      const empty = emptyEntries(categoriesRef.current)
      setEntries(empty)
      setNotes('')
      entriesRef.current = empty
      notesRef.current = ''
      return
    }
    const draft = applyCheckInDraft(
      categoriesRef.current,
      loadCheckInDraft(userId),
    )
    setEntries(draft.entries)
    setNotes(draft.notes)
    entriesRef.current = draft.entries
    notesRef.current = draft.notes
  }, [active, userId])

  useEffect(() => {
    setEntries((prev) => {
      const next = emptyEntries(categories)
      for (const cat of categories) {
        if (prev[cat.id]) next[cat.id] = prev[cat.id]
      }
      entriesRef.current = next
      return next
    })
  }, [categories])

  useEffect(() => {
    function flush() {
      if (!activeRef.current) return
      saveCheckInDraft(userIdRef.current, {
        entries: entriesRef.current,
        notes: notesRef.current,
      })
    }
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', flush)
    return () => {
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', flush)
    }
  }, [])

  const persist = useCallback(
    (nextEntries: Record<string, CategoryEntry>, nextNotes: string) => {
      if (!activeRef.current) return
      saveCheckInDraft(userIdRef.current, {
        entries: nextEntries,
        notes: nextNotes,
      })
    },
    [],
  )

  const updateEntry = useCallback(
    (id: string, entry: CategoryEntry) => {
      setEntries((prev) => {
        const next = { ...prev, [id]: entry }
        entriesRef.current = next
        persist(next, notesRef.current)
        return next
      })
    },
    [persist],
  )

  const updateNotes = useCallback(
    (value: string) => {
      notesRef.current = value
      setNotes(value)
      persist(entriesRef.current, value)
    },
    [persist],
  )

  const resetDraft = useCallback(() => {
    const next = emptyEntries(categoriesRef.current)
    setEntries(next)
    setNotes('')
    entriesRef.current = next
    notesRef.current = ''
    clearCheckInDraft(userIdRef.current)
  }, [])

  return { entries, notes, updateEntry, updateNotes, resetDraft }
}
