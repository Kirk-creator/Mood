import { useCallback, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { isSupabaseConfigured } from '../lib/env'
import {
  getSession,
  getSupabase,
  requestPasswordReset,
  signInWithEmail,
  signOut,
  signUpWithEmail,
  updatePassword,
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
  const [passwordRecovery, setPasswordRecovery] = useState(false)

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

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecovery(true)
      }
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
    setPasswordRecovery(false)
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
    setPasswordRecovery(false)
    return { ok: true as const }
  }, [])

  const requestReset = useCallback(async (email: string) => {
    setAuthMessage(null)
    const { error } = await requestPasswordReset(email)
    if (error) {
      setAuthMessage(error.message)
      return { ok: false as const, message: error.message }
    }
    const message =
      'If an account exists for that email, a reset link is on the way.'
    setAuthMessage(message)
    return { ok: true as const, message }
  }, [])

  const completePasswordReset = useCallback(async (password: string) => {
    setAuthMessage(null)
    const { error } = await updatePassword(password)
    if (error) {
      setAuthMessage(error.message)
      return { ok: false as const, message: error.message }
    }
    setPasswordRecovery(false)
    setAuthMessage('Password updated. You’re signed in.')
    return { ok: true as const }
  }, [])

  const logOut = useCallback(async () => {
    setAuthMessage(null)
    setPasswordRecovery(false)
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
    passwordRecovery,
    signIn,
    signUp,
    requestReset,
    completePasswordReset,
    logOut,
  }
}
