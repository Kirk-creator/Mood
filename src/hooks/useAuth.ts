import { useCallback, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { isSupabaseConfigured } from '../lib/env'
import {
  getSession,
  getSupabase,
  signInWithEmail,
  signOut,
  signUpWithEmail,
} from '../lib/supabase'

export type AuthStatus = 'loading' | 'signed-out' | 'signed-in' | 'local'

export function useAuth() {
  const configured = isSupabaseConfigured()
  const [status, setStatus] = useState<AuthStatus>(() =>
    configured ? 'loading' : 'local',
  )
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [authMessage, setAuthMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!configured) {
      setStatus('local')
      return
    }

    const supabase = getSupabase()
    if (!supabase) {
      setStatus('local')
      return
    }

    let cancelled = false

    void getSession().then((next) => {
      if (cancelled) return
      setSession(next)
      setUser(next?.user ?? null)
      setStatus(next ? 'signed-in' : 'signed-out')
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setUser(next?.user ?? null)
      setStatus(next ? 'signed-in' : 'signed-out')
    })

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [configured])

  const signIn = useCallback(async (email: string, password: string) => {
    setAuthMessage(null)
    const { session: next, error } = await signInWithEmail(email, password)
    if (error) {
      setAuthMessage(error.message)
      return { ok: false as const, message: error.message }
    }
    if (!next) {
      const message = 'Sign-in did not return a session.'
      setAuthMessage(message)
      return { ok: false as const, message }
    }
    return { ok: true as const }
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    setAuthMessage(null)
    const { session: next, error } = await signUpWithEmail(email, password)
    if (error) {
      setAuthMessage(error.message)
      return { ok: false as const, message: error.message }
    }
    if (!next) {
      const message =
        'Account created. Check your email to confirm, then log in.'
      setAuthMessage(message)
      return { ok: false as const, message, needsConfirmation: true as const }
    }
    return { ok: true as const }
  }, [])

  const logOut = useCallback(async () => {
    setAuthMessage(null)
    const error = await signOut()
    if (error) setAuthMessage(error.message)
  }, [])

  return {
    configured,
    status,
    user,
    session,
    authMessage,
    setAuthMessage,
    signIn,
    signUp,
    logOut,
  }
}
