import { useCallback, useEffect, useState } from 'react'
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
    setCheckIns(loadCheckIns())
    setReady(true)
  }, [])

  const add = useCallback((checkIn: CheckIn) => {
    setCheckIns(createCheckIn(checkIn))
  }, [])

  const update = useCallback((checkIn: CheckIn) => {
    setCheckIns(updateCheckIn(checkIn))
  }, [])

  const remove = useCallback((id: string) => {
    setCheckIns(deleteCheckIn(id))
  }, [])

  return { checkIns, ready, add, update, remove }
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings())
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setSettings(loadSettings())
    setReady(true)
  }, [])

  const updateSettings = useCallback((next: AppSettings) => {
    saveSettings(next)
    setSettings(next)
  }, [])

  return { settings, ready, updateSettings }
}
