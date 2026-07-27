import { useCallback, useEffect, useState } from 'react'
import {
  clearAccountCache,
  hydrateAccount,
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
  setStorageUserId,
  updateCheckIn,
} from '../storage'
import type { AppSettings, CheckIn } from '../types'

export type CloudSyncState =
  | 'local-only'
  | 'idle'
  | 'syncing'
  | 'synced'
  | 'error'

export function useCheckIns(userId: string | null) {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings())
  const [ready, setReady] = useState(false)
  const [cloudSync, setCloudSync] = useState<CloudSyncState>('idle')
  const [cloudError, setCloudError] = useState<string | null>(null)
  const [syncNonce, setSyncNonce] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!isSupabaseConfigured()) {
        setStorageUserId(null)
        setCheckIns(loadCheckIns())
        setSettings(loadSettings())
        setCloudSync('local-only')
        setReady(true)
        return
      }

      if (!userId) {
        clearAccountCache()
        setCheckIns([])
        setSettings(loadSettings())
        setCloudSync('idle')
        setReady(false)
        return
      }

      setReady(false)
      setCloudSync('syncing')
      setCloudError(null)

      try {
        const account = await hydrateAccount(userId)
        if (cancelled) return
        setCheckIns(account.checkIns)
        setSettings(account.settings)
        setCloudSync('synced')
        setReady(true)
      } catch (err: unknown) {
        if (cancelled) return
        const message = err instanceof Error ? err.message : String(err)
        console.warn('Account hydrate failed', err)
        setStorageUserId(userId)
        setCheckIns(loadCheckIns())
        setSettings(loadSettings())
        setCloudSync('error')
        setCloudError(message)
        setReady(true)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [userId, syncNonce])

  const retrySync = useCallback(() => {
    setSyncNonce((n) => n + 1)
  }, [])

  const add = useCallback((checkIn: CheckIn) => {
    setCheckIns(createCheckIn(checkIn))
    void pushCheckIn(checkIn).then((synced) => {
      if (synced && synced.id !== checkIn.id) {
        setCheckIns(loadCheckIns())
      }
    })
  }, [])

  const update = useCallback((checkIn: CheckIn) => {
    setCheckIns(updateCheckIn(checkIn))
    void pushCheckIn(checkIn).then((synced) => {
      if (synced && synced.id !== checkIn.id) {
        setCheckIns(loadCheckIns())
      }
    })
  }, [])

  const remove = useCallback((id: string) => {
    setCheckIns(deleteCheckIn(id))
    void pushDeleteCheckIn(id)
  }, [])

  const updateSettings = useCallback((next: AppSettings) => {
    saveSettings(next)
    setSettings(next)
    void pushSettings(next)
  }, [])

  return {
    checkIns,
    settings,
    ready,
    add,
    update,
    remove,
    updateSettings,
    cloudSync,
    cloudError,
    retrySync,
  }
}
