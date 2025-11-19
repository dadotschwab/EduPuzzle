/**
 * @fileoverview React Query hook for subscription state management
 *
 * Provides subscription status, trial information, and access permissions
 * using React Query for caching and automatic refetching.
 *
 * @module hooks/useSubscription
 */

import { useQuery } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { checkSubscriptionStatus, type SubscriptionStatusResponse } from '@/lib/api/stripe'

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
 * @returns refetch - Function to manually refetch subscription status
 *
 * @example
 * ```typescript
 * const { data, hasAccess, isTrial, daysRemaining, isLoading } = useSubscription()
 *
 * if (isLoading) return <LoadingSpinner />
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
    staleTime: 5 * 60 * 1000, // 5 minutes - subscription status doesn't change often
    gcTime: 10 * 60 * 1000, // 10 minutes cache time
  })

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
  }
}
