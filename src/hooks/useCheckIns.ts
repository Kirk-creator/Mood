import { useCallback, useEffect, useState } from 'react'
import {
  createCheckIn,
  deleteCheckIn,
  loadCheckIns,
  updateCheckIn,
} from '../storage'
import type { CheckIn } from '../types'

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
