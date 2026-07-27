import {
  createClient,
  type Session,
  type SupabaseClient,
  type User,
} from '@supabase/supabase-js'
import { getSupabaseConfig } from './env'

export type PulseDatabase = {
  public: {
    Tables: {
      check_ins: {
        Row: {
          id: string
          user_id: string
          timestamp: string
          notes: string
          entries: Record<string, unknown>
          updated_at: string
        }
        Insert: {
          id: string
          user_id: string
          timestamp: string
          notes?: string
          entries?: Record<string, unknown>
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          timestamp?: string
          notes?: string
          entries?: Record<string, unknown>
          updated_at?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          user_id: string
          categories: unknown
          updated_at: string
        }
        Insert: {
          user_id: string
          categories: unknown
          updated_at?: string
        }
        Update: {
          user_id?: string
          categories?: unknown
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type AuthResult = {
  user: User | null
  session: Session | null
  error: { message: string } | null
}

let client: SupabaseClient<PulseDatabase> | null | undefined

export function getSupabase(): SupabaseClient<PulseDatabase> | null {
  if (client !== undefined) return client
  const config = getSupabaseConfig()
  if (!config) {
    client = null
    return client
  }
  client = createClient<PulseDatabase>(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  })
  return client
}

export async function getSession(): Promise<Session | null> {
  const supabase = getSupabase()
  if (!supabase) return null
  const { data, error } = await supabase.auth.getSession()
  if (error) {
    console.warn('Supabase session read failed', error.message)
    return null
  }
  return data.session
}

/** Returns the signed-in user id, or null if logged out. */
export async function requireUserId(): Promise<string | null> {
  const session = await getSession()
  return session?.user?.id ?? null
}

export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<AuthResult> {
  const supabase = getSupabase()
  if (!supabase) {
    return {
      user: null,
      session: null,
      error: { message: 'Supabase is not configured for this build.' },
    }
  }

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
  })
  return {
    user: data.user,
    session: data.session,
    error: error ? { message: error.message } : null,
  }
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<AuthResult> {
  const supabase = getSupabase()
  if (!supabase) {
    return {
      user: null,
      session: null,
      error: { message: 'Supabase is not configured for this build.' },
    }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })
  return {
    user: data.user,
    session: data.session,
    error: error ? { message: error.message } : null,
  }
}

export async function signOut(): Promise<{ message: string } | null> {
  const supabase = getSupabase()
  if (!supabase) return null
  const { error } = await supabase.auth.signOut()
  return error ? { message: error.message } : null
}
