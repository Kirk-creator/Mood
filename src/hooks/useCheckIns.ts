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
  loadLegacyGuestSettings,
  loadSettings,
  reconcileCategoriesAndCheckIns,
  saveCheckIns,
  saveSettings,
  setStorageUserId,
  updateCheckIn,
  checkInsEqual,
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
  const [settings, setSettings] = useState<AppSettings>(() => {
    const loaded = loadSettings()
    saveSettings(loaded)
    return loaded
  })
  const [ready, setReady] = useState(false)
  const [cloudSync, setCloudSync] = useState<CloudSyncState>('idle')
  const [cloudError, setCloudError] = useState<string | null>(null)
  const [syncNonce, setSyncNonce] = useState(0)

  useEffect(() => {
    let cancelled = false

    function loadLocalAccount() {
      const guestSettings = loadLegacyGuestSettings()
      const reconciled = reconcileCategoriesAndCheckIns(
        loadSettings(),
        loadCheckIns(),
        [guestSettings],
      )
      saveSettings(reconciled.settings)
      saveCheckIns(reconciled.checkIns)
      return reconciled
    }

    async function load() {
      if (!isSupabaseConfigured()) {
        setStorageUserId(null)
        const local = loadLocalAccount()
        setCheckIns(local.checkIns)
        setSettings(local.settings)
        setCloudSync('local-only')
        setReady(true)
        return
      }

      if (!userId) {
        clearAccountCache()
        setCheckIns([])
        const local = loadLocalAccount()
        setSettings(local.settings)
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
        const local = loadLocalAccount()
        setCheckIns(local.checkIns)
        setSettings(local.settings)
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

  const updateSettings = useCallback(
    (next: AppSettings) => {
      const before = loadCheckIns()
      const reconciled = reconcileCategoriesAndCheckIns(next, before, [settings])
      saveSettings(reconciled.settings)
      saveCheckIns(reconciled.checkIns)
      setSettings(reconciled.settings)
      setCheckIns(reconciled.checkIns)
      void pushSettings(reconciled.settings)
      if (!checkInsEqual(before, reconciled.checkIns)) {
        for (const checkIn of reconciled.checkIns) {
          const prev = before.find((c) => c.id === checkIn.id)
          if (
            !prev ||
            JSON.stringify(prev.entries) !== JSON.stringify(checkIn.entries)
          ) {
            void pushCheckIn(checkIn)
          }
        }
      }
    },
    [settings],
  )

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
