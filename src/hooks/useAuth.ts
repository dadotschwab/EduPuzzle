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

/**
 * Subscription metadata structure from JWT
 */
interface SubscriptionMetadata {
  status: 'active' | 'trial' | 'trialing' | 'expired' | 'canceled' | 'none'
  has_access: boolean
  is_trial: boolean
  expires_at: string | null
  trial_ends_at: string | null
  checked_at: string
}

interface ExtendedUser extends User {
  name?: string
  subscription?: SubscriptionMetadata
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
      // Fetch name from users table
      const { data: profile } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', authUser.id)
        .single()

      // Extract subscription from JWT metadata
      const subscriptionMeta = authUser.app_metadata?.subscription || {
        status: 'none',
        has_access: false,
        is_trial: false,
        expires_at: null,
        trial_ends_at: null,
        checked_at: new Date().toISOString(),
      }

      return {
        ...authUser,
        name: profile?.name || authUser.email?.split('@')[0] || 'User',
        subscription: subscriptionMeta,
      } as ExtendedUser
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return {
        ...authUser,
        name: authUser.email?.split('@')[0] || 'User',
        subscription: {
          status: 'none',
          has_access: false,
          is_trial: false,
          expires_at: null,
          trial_ends_at: null,
          checked_at: new Date().toISOString(),
        },
      } as ExtendedUser
    }
  }

  const refreshUser = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session?.user) {
      const userWithProfile = await fetchUserProfile(session.user)
      setUser(userWithProfile)
    }
  }

  // Force refresh subscription metadata
  const refreshSubscription = async () => {
    if (!user) return

    // Call Edge Function to update metadata
    const { data, error } = await supabase.functions.invoke('update-user-subscription', {
      body: { userId: user.id },
    })

    if (!error) {
      // Refresh the session to get new JWT with updated metadata
      const {
        data: { session },
      } = await supabase.auth.refreshSession()

      if (session?.user) {
        const userWithProfile = await fetchUserProfile(session.user)
        setUser(userWithProfile)
      }
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
    refreshSubscription, // NEW: Force refresh subscription
    isAuthenticated: !!user,
    // Subscription helpers (no separate hook needed)
    hasAccess: user?.subscription?.has_access ?? false,
    isTrial: user?.subscription?.is_trial ?? false,
    subscriptionStatus: user?.subscription?.status ?? 'none',
    subscriptionExpiresAt: user?.subscription?.expires_at,
  }
}
