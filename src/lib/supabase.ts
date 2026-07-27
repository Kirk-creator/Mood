import { createClient, type SupabaseClient } from '@supabase/supabase-js'
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
      detectSessionInUrl: false,
    },
  })
  return client
}

/** Ensure an anonymous session exists; returns user id or null. */
export async function ensureUserId(): Promise<string | null> {
  const supabase = getSupabase()
  if (!supabase) return null

  const { data: existing, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) {
    console.warn('Supabase session read failed', sessionError.message)
  }
  if (existing.session?.user?.id) return existing.session.user.id

  const { data, error } = await supabase.auth.signInAnonymously()
  if (error) {
    console.warn(
      'Supabase anonymous sign-in failed. Enable Anonymous sign-ins in the Supabase dashboard.',
      error.message,
    )
    return null
  }
  return data.user?.id ?? null
}
