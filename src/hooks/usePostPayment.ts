/**
 * @fileoverview React hook for post-payment subscription status refresh
 *
 * Handles subscription status invalidation after successful Stripe checkout
 * to ensure UI updates immediately reflect payment completion.
 *
 * @module hooks/usePostPayment
 */

import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useAuth } from './useAuth'

/**
 * Hook for refreshing subscription status after payment completion
 *
 * Invalidates and refetches subscription queries to ensure UI reflects
 * the latest payment status. Should be called after successful checkout
 * redirect or when payment confirmation is received.
 *
 * @returns Functions to manage post-payment subscription refresh
 *
 * @example
 * ```typescript
 * const { invalidateSubscription, refreshSubscription } = usePostPayment()
 *
 * // After successful checkout redirect
 * useEffect(() => {
 *   const urlParams = new URLSearchParams(window.location.search)
 *   if (urlParams.get('session_id')) {
 *     refreshSubscription()
 *   }
 * }, [])
 *
 * // Manual refresh after webhook confirmation
 * const handlePaymentConfirmed = () => {
 *   invalidateSubscription()
 * }
 * ```
 */
export function usePostPayment() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  /**
   * Invalidates subscription query cache
   * Forces React Query to refetch subscription status from server
   */
  const invalidateSubscription = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ['subscription', user?.id],
      exact: true,
    })
  }, [queryClient, user?.id])

  /**
   * Refetches subscription status immediately
   * Combines invalidation with immediate refetch for faster UI updates
   */
  const refreshSubscription = useCallback(async () => {
    await queryClient.refetchQueries({
      queryKey: ['subscription', user?.id],
      exact: true,
      type: 'active',
    })
  }, [queryClient, user?.id])

  /**
   * Removes subscription query from cache
   * Useful when user logs out or needs complete cache reset
   */
  const clearSubscriptionCache = useCallback(() => {
    queryClient.removeQueries({
      queryKey: ['subscription', user?.id],
      exact: true,
    })
  }, [queryClient, user?.id])

  return {
    invalidateSubscription,
    refreshSubscription,
    clearSubscriptionCache,
  }
}
