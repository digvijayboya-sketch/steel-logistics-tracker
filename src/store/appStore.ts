import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { apiGetProfile, apiSignIn, apiSignOut } from '@/lib/api'
import type { UserRole } from '@/types'

export interface AuthUser {
  id:    string
  name:  string
  email: string
  role:  UserRole
}

interface AuthState {
  user:      AuthUser | null
  loading:   boolean
  login:     (email: string, password: string) => Promise<{ error?: string }>
  logout:    () => Promise<void>
  init:      () => Promise<void>         // called once on app mount
}

export const useAuthStore = create<AuthState>((set) => ({
  user:    null,
  loading: true,

  // ── Bootstrap: restore session from Supabase on page load ──
  init: async () => {
    set({ loading: true })
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const profile = await apiGetProfile(session.user.id)
        set({
          user: {
            id:    profile.id,
            name:  profile.full_name,
            email: session.user.email ?? '',
            role:  profile.role,
          },
        })
      }
    } catch {
      // No active session – that's fine
    } finally {
      set({ loading: false })
    }

    // Listen for Supabase auth state changes (token refresh, sign-out)
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        set({ user: null })
        return
      }
      if (event === 'SIGNED_IN' && session.user) {
        try {
          const profile = await apiGetProfile(session.user.id)
          set({
            user: {
              id:    profile.id,
              name:  profile.full_name,
              email: session.user.email ?? '',
              role:  profile.role,
            },
          })
        } catch { /* profile not ready yet – handle below */ }
      }
    })
  },

  // ── Sign in ────────────────────────────────────────────────
  login: async (email, password) => {
    set({ loading: true })
    try {
      const { data, error } = await apiSignIn(email, password)
      if (error) return { error: error.message }
      if (!data.user) return { error: 'No user returned' }

      const profile = await apiGetProfile(data.user.id)
      set({
        user: {
          id:    profile.id,
          name:  profile.full_name,
          email: data.user.email ?? '',
          role:  profile.role,
        },
      })
      return {}
    } catch (e: unknown) {
      return { error: e instanceof Error ? e.message : 'Login failed' }
    } finally {
      set({ loading: false })
    }
  },

  // ── Sign out ───────────────────────────────────────────────
  logout: async () => {
    await apiSignOut()
    set({ user: null })
  },
}))
