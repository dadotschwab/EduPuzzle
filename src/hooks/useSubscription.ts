/**
 * @fileoverview React Query hook for subscription state management
 *
 * @deprecated Use useAuth() instead. Subscription data is now in JWT token.
 * This hook is kept for backward compatibility during migration.
 *
 * Provides subscription status, trial information, and access permissions
 * by reading from JWT metadata instead of database queries.
 *
 * @module hooks/useSubscription
 */

import { useCallback } from 'react'
import { useAuth } from './useAuth'

/**
 * Hook for accessing subscription status and access permissions
 *
 * @deprecated Use useAuth() instead. Subscription data is now in JWT token.
 * This hook is kept for backward compatibility during migration.
 *
 * Reads subscription data from JWT metadata instead of database queries.
 * Provides the same interface as before for compatibility.
 *
 * @returns Subscription state and helper functions
 * @returns data - Current subscription status data (null if not authenticated)
 * @returns isLoading - Whether auth state is being loaded (much faster now)
 * @returns error - Always null (data comes from JWT)
 * @returns hasAccess - Whether user has premium access (from JWT)
 * @returns isTrial - Whether user is currently in trial period (from JWT)
 * @returns isActive - Whether user has active subscription (from JWT)
 * @returns daysRemaining - Days remaining in trial/subscription (calculated)
 * @returns errorType - Always null (no more API errors)
 * @returns retry - No-op function (data comes from JWT)
 * @returns refetch - No-op function (data comes from JWT)
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
  const { user, loading, hasAccess, isTrial, subscriptionStatus, subscriptionExpiresAt } = useAuth()

  // Calculate days remaining
  const daysRemaining = subscriptionExpiresAt
    ? Math.max(
        0,
        Math.ceil((new Date(subscriptionExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      )
    : null

  // Return same interface as before for compatibility
  return {
    data: user?.subscription || null,
    isLoading: loading,
    error: null,
    hasAccess,
    isTrial,
    isActive: subscriptionStatus === 'active',
    daysRemaining,
    errorType: null,
    retry: () => {}, // No-op, data comes from JWT
    refetch: () => {}, // No-op, data comes from JWT
  }
}
