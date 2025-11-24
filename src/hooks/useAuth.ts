/**
 * @fileoverview Authentication hook using Supabase Auth
 *
 * Provides authentication state management through a React hook.
 * Handles:
 * - Initial session loading
 * - Real-time auth state changes
 * - Sign out functionality
 * - User profile data (name from public.users table)
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

interface UserProfile {
  name: string
  email: string
}

interface ExtendedUser extends User {
  name?: string
}

/**
 * Hook for accessing authentication state and methods
 * @returns Authentication state and helper functions
 * @returns user - Current authenticated user with profile data or null
 * @returns loading - Whether auth state is being loaded
 * @returns signOut - Function to sign out the current user
 * @returns isAuthenticated - Boolean indicating if user is authenticated
 * @returns refreshUser - Function to refresh user profile data
 */
export function useAuth() {
  const [user, setUser] = useState<ExtendedUser | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const fetchUserProfile = async (authUser: User) => {
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', authUser.id)
        .single()

      return {
        ...authUser,
        name: profile?.name || authUser.email?.split('@')[0] || 'User',
      } as ExtendedUser
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return {
        ...authUser,
        name: authUser.email?.split('@')[0] || 'User',
      } as ExtendedUser
    }
  }

  const refreshUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      const userWithProfile = await fetchUserProfile(session.user)
      setUser(userWithProfile)
    }
  }

  useEffect(() => {
    // Get initial session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const userWithProfile = await fetchUserProfile(session.user)
        setUser(userWithProfile)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    // Subscribe to auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const userWithProfile = await fetchUserProfile(session.user)
        setUser(userWithProfile)
      } else {
        setUser(null)
      }
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
    refreshUser,
    isAuthenticated: !!user,
  }
}
