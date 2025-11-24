import { useCallback } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '@/lib/supabase'

interface AuthGuardOptions {
  requireAuth?: boolean
  redirectTo?: string
  onUnauthenticated?: () => void
}

export function useAuthGuard(options: AuthGuardOptions = {}) {
  const { user, isAuthenticated, loading } = useAuth()
  const { requireAuth = true, redirectTo = '/login', onUnauthenticated } = options

  const guard = useCallback(
    async <T>(operation: () => Promise<T>): Promise<T> => {
      // Wait for auth state to load
      if (loading) {
        await new Promise((resolve) => {
          const checkAuth = () => {
            if (!loading) resolve(undefined)
            else setTimeout(checkAuth, 50)
          }
          checkAuth()
        })
      }

      // Check authentication
      if (requireAuth && !isAuthenticated) {
        if (onUnauthenticated) {
          onUnauthenticated()
        } else if (redirectTo) {
          window.location.href = redirectTo
        }
        throw new Error('Authentication required')
      }

      // Check session validity (refresh if needed)
      if (user) {
        try {
          const { data: sessionData, error } = await supabase.auth.getSession()
          if (error || !sessionData.session) {
            throw new Error('Invalid session')
          }

          // Check if session expires soon (within 5 minutes)
          const expiresAt = sessionData.session.expires_at
          if (expiresAt) {
            const expiryTime = expiresAt * 1000
            const timeUntilExpiry = expiryTime - Date.now()

            if (timeUntilExpiry < 5 * 60 * 1000) {
              const { error: refreshError } = await supabase.auth.refreshSession()
              if (refreshError) {
                throw new Error('Session refresh failed')
              }
            }
          }
        } catch (error) {
          // Session invalid - redirect to login
          if (onUnauthenticated) {
            onUnauthenticated()
          } else if (redirectTo) {
            window.location.href = redirectTo
          }
          throw new Error('Session expired. Please log in again.')
        }
      }

      // Execute operation with valid auth
      return operation()
    },
    [user, isAuthenticated, loading, requireAuth, redirectTo, onUnauthenticated]
  )

  return { guard, isAuthenticated, loading }
}
