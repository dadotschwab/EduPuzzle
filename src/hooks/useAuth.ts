/**
 * @fileoverview Authentication hook using Supabase Auth
 *
 * Provides authentication state management through a React hook.
 * Handles:
 * - Initial session loading
 * - Real-time auth state changes
 * - Sign out functionality
 *
 * Uses local state (not Zustand store) for simplicity and direct
 * integration with Supabase auth listeners.
 *
 * @module hooks/useAuth
 */

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import { useNavigate } from 'react-router-dom'

/**
 * Hook for accessing authentication state and methods
 * @returns Authentication state and helper functions
 * @returns user - Current authenticated user or null
 * @returns loading - Whether auth state is being loaded
 * @returns signOut - Function to sign out the current user
 * @returns isAuthenticated - Boolean indicating if user is authenticated
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // Get initial session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Subscribe to auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe()
  }, [])

  /**
   * Signs out the current user and navigates to landing page
   */
  const signOut = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  return {
    user,
    loading,
    signOut,
    isAuthenticated: !!user,
  }
}
