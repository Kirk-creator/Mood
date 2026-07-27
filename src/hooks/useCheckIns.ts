import { useCallback, useEffect, useState } from 'react'
import {
  hydrateCheckIns,
  hydrateSettings,
  pushCheckIn,
  pushDeleteCheckIn,
  pushSettings,
} from '../lib/cloudSync'
import { isSupabaseConfigured } from '../lib/env'
import {
  createCheckIn,
  deleteCheckIn,
  loadCheckIns,
  loadSettings,
  saveSettings,
  updateCheckIn,
} from '../storage'
import type { AppSettings, CheckIn } from '../types'

export type CloudSyncState =
  | 'local-only'
  | 'syncing'
  | 'synced'
  | 'error'

export function useCheckIns() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [ready, setReady] = useState(false)
  const [cloudSync, setCloudSync] = useState<CloudSyncState>(() =>
    isSupabaseConfigured() ? 'syncing' : 'local-only',
  )
  const [cloudError, setCloudError] = useState<string | null>(null)
  const [syncNonce, setSyncNonce] = useState(0)

  useEffect(() => {
    let cancelled = false
    setCheckIns(loadCheckIns())
    setReady(true)

    if (!isSupabaseConfigured()) {
      setCloudSync('local-only')
      return
    }

    setCloudSync('syncing')
    setCloudError(null)
    void hydrateCheckIns()
      .then((next) => {
        if (cancelled) return
        setCheckIns(next)
        setCloudSync('synced')
        setCloudError(null)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message = err instanceof Error ? err.message : String(err)
        console.warn('Check-in sync failed', err)
        setCloudSync('error')
        setCloudError(message)
      })

    return () => {
      cancelled = true
    }
  }, [syncNonce])

  const retrySync = useCallback(() => {
    if (!isSupabaseConfigured()) return
    setSyncNonce((n) => n + 1)
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

  return {
    checkIns,
    ready,
    add,
    update,
    remove,
    cloudSync,
    cloudError,
    retrySync,
  }
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
