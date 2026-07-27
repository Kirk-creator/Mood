import { useCallback, useEffect, useState } from 'react'
import {
  hydrateCheckIns,
  hydrateSettings,
  pushCheckIn,
  pushDeleteCheckIn,
  pushSettings,
} from '../lib/cloudSync'
import {
  createCheckIn,
  deleteCheckIn,
  loadCheckIns,
  loadSettings,
  saveSettings,
  updateCheckIn,
} from '../storage'
import type { AppSettings, CheckIn } from '../types'

export function useCheckIns() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    setCheckIns(loadCheckIns())
    setReady(true)

    void hydrateCheckIns()
      .then((next) => {
        if (!cancelled) setCheckIns(next)
      })
      .catch((err: unknown) => {
        console.warn('Check-in sync failed', err)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const add = useCallback((checkIn: CheckIn) => {
    setCheckIns(createCheckIn(checkIn))
    void pushCheckIn(checkIn)
  }, [])

  const update = useCallback((checkIn: CheckIn) => {
    setCheckIns(updateCheckIn(checkIn))
    void pushCheckIn(checkIn)
  }, [])

  const remove = useCallback((id: string) => {
    setCheckIns(deleteCheckIn(id))
    void pushDeleteCheckIn(id)
  }, [])

  return { checkIns, ready, add, update, remove }
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings())
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    setSettings(loadSettings())
    setReady(true)

    void hydrateSettings()
      .then((next) => {
        if (!cancelled) setSettings(next)
      })
      .catch((err: unknown) => {
        console.warn('Settings sync failed', err)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const updateSettings = useCallback((next: AppSettings) => {
    saveSettings(next)
    setSettings(next)
    void pushSettings(next)
  }, [])

  return { settings, ready, updateSettings }
}
