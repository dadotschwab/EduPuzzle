/**
 * @fileoverview React Query hook for Stripe checkout flow management
 *
 * Handles creating checkout sessions and managing the checkout process
 * with proper loading states and error handling.
 *
 * @module hooks/useCheckout
 */

import { useMutation } from '@tanstack/react-query'
import { createCheckoutSession, type CreateCheckoutRequest } from '@/lib/api/stripe'
import { logger } from '@/lib/logger'

/**
 * Hook for managing Stripe checkout flow
 *
 * Creates checkout sessions and handles redirects to Stripe Checkout.
 * Provides loading states and error handling for the checkout process.
 *
 * @returns Checkout mutation and helper functions
 * @returns mutate - Function to initiate checkout (accepts optional config)
 * @returns isPending - Whether checkout session is being created
 * @returns error - Any error that occurred during checkout creation
 * @returns reset - Function to reset error state
 *
 * @example
 * ```typescript
 * const { mutate: startCheckout, isPending, error } = useCheckout()
 *
 * const handleUpgrade = () => {
 *   startCheckout({
 *     successUrl: '/subscription/success',
 *     cancelUrl: '/subscription/cancelled'
 *   })
 * }
 *
 * if (isPending) return <LoadingSpinner />
 * if (error) return <ErrorMessage error={error} />
 *
 * return <button onClick={handleUpgrade}>Upgrade Now</button>
 * ```
 */
export function useCheckout() {
  const mutation = useMutation({
    mutationFn: (request: CreateCheckoutRequest = {}) => createCheckoutSession(request),
    onSuccess: (data) => {
      logger.info('Checkout session created, redirecting to Stripe', {
        sessionId: data.sessionId,
      })

      // Redirect to Stripe Checkout
      window.location.href = data.sessionUrl
    },
    onError: (error) => {
      logger.error('Checkout creation failed', { error })
    },
  })

  return {
    ...mutation,
    // Alias mutate to startCheckout for clearer API
    startCheckout: mutation.mutate,
    startCheckoutAsync: mutation.mutateAsync,
  }
}
