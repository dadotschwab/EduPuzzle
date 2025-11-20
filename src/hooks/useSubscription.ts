/**
 * @fileoverview React Query hook for subscription state management
 *
 * Provides subscription status, trial information, and access permissions
 * using React Query for caching and automatic refetching.
 *
 * @module hooks/useSubscription
 */

import { useQuery } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useAuth } from './useAuth'
import {
  checkSubscriptionStatus,
  type SubscriptionStatusResponse,
  StripeApiError,
} from '@/lib/api/stripe'

/**
 * Hook for accessing subscription status and access permissions
 *
 * Fetches and caches subscription data using React Query. Only fetches when user is authenticated
 * and auth loading is complete to prevent race conditions.
 * Provides subscription status, trial info, access permissions, and loading/error states.
 *
 * @returns Subscription state and helper functions
 * @returns data - Current subscription status data (null if not authenticated)
 * @returns isLoading - Whether subscription status is being fetched
 * @returns error - Any error that occurred during fetching
 * @returns hasAccess - Whether user has premium access (convenience getter)
 * @returns isTrial - Whether user is currently in trial period
 * @returns isActive - Whether user has active subscription
 * @returns daysRemaining - Days remaining in trial/subscription
 * @returns errorType - Classified error type for better UX
 * @returns retry - Function to manually retry failed requests
 * @returns refetch - Function to manually refetch subscription status
 *
 * @example
 * ```typescript
 * const { data, hasAccess, isTrial, daysRemaining, isLoading, errorType, retry } = useSubscription()
 *
 * if (isLoading) return <LoadingSpinner />
 *
 * if (errorType === 'auth') {
 *   return <AuthError onRetry={retry} />
 * }
 *
 * if (!hasAccess) {
 *   return <UpgradePrompt daysRemaining={daysRemaining} />
 * }
 *
 * return <PremiumContent />
 * ```
 */
export function useSubscription() {
  const { user, isAuthenticated, loading } = useAuth()

  const query = useQuery<SubscriptionStatusResponse>({
    queryKey: ['subscription', user?.id],
    queryFn: checkSubscriptionStatus,
    enabled: !loading && isAuthenticated && !!user?.id,
    staleTime: 2 * 60 * 1000, // Reduced from 5 minutes to 2 minutes for faster updates after payment
    gcTime: 10 * 60 * 1000,
    // Add refetch on window focus to catch payment completion
    refetchOnWindowFocus: true,
    refetchOnReconnect: true, // 10 minutes cache time
    retry: (failureCount, error: Error) => {
      // Don't retry auth errors
      if (
        error instanceof StripeApiError &&
        (error.statusCode === 401 || error.code === 'AUTH_FAILED')
      ) {
        return false
      }
      // Retry network/server errors up to 3 times
      return failureCount < 3
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  // Enhanced error classification
  const getErrorType = (error: Error | null) => {
    if (!error) return null
    if (error instanceof StripeApiError) {
      if (error.statusCode === 401 || error.code === 'AUTH_FAILED') return 'auth'
      if (error.statusCode === 429) return 'rate_limit'
      if (error.statusCode && error.statusCode >= 500) return 'server'
      if (error.statusCode && error.statusCode >= 400) return 'client'
    }
    if (error.message?.includes('fetch')) return 'network'
    return 'unknown'
  }

  // Retry function
  const retry = useCallback(() => {
    query.refetch()
  }, [query])

  // Convenience getters
  const hasAccess = query.data?.hasAccess ?? false
  const isTrial = query.data?.status === 'trial'
  const isActive = query.data?.status === 'active'
  const daysRemaining = query.data?.daysRemaining ?? null

  return {
    ...query,
    hasAccess,
    isTrial,
    isActive,
    daysRemaining,
    errorType: getErrorType(query.error),
    retry,
  }
}
