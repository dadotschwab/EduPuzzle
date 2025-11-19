/**
 * @fileoverview React Query hook for Stripe Customer Portal management
 *
 * Handles creating customer portal sessions for subscription management
 * with proper loading states and error handling.
 *
 * @module hooks/useCustomerPortal
 */

import { useMutation } from '@tanstack/react-query'
import { createPortalSession, type CreatePortalRequest } from '@/lib/api/stripe'
import { logger } from '@/lib/logger'

/**
 * Hook for managing Stripe Customer Portal access
 *
 * Creates portal sessions for subscription management and handles redirects
 * to the Stripe Customer Portal. Provides loading states and error handling.
 *
 * @returns Portal mutation and helper functions
 * @returns mutate - Function to initiate portal access (accepts optional config)
 * @returns isPending - Whether portal session is being created
 * @returns error - Any error that occurred during portal creation
 * @returns reset - Function to reset error state
 *
 * @example
 * ```typescript
 * const { mutate: openPortal, isPending, error } = useCustomerPortal()
 *
 * const handleManageSubscription = () => {
 *   openPortal({
 *     returnUrl: '/settings/subscription'
 *   })
 * }
 *
 * if (isPending) return <LoadingSpinner />
 * if (error) return <ErrorMessage error={error} />
 *
 * return <button onClick={handleManageSubscription}>Manage Subscription</button>
 * ```
 */
export function useCustomerPortal() {
  const mutation = useMutation({
    mutationFn: (request: CreatePortalRequest = {}) => createPortalSession(request),
    onSuccess: (data) => {
      logger.info('Portal session created, redirecting to Stripe Customer Portal')

      // Redirect to Stripe Customer Portal
      window.location.href = data.url
    },
    onError: (error) => {
      logger.error('Portal session creation failed', { error })
    },
  })

  return {
    ...mutation,
    // Alias mutate to openPortal for clearer API
    openPortal: mutation.mutate,
    openPortalAsync: mutation.mutateAsync,
  }
}
