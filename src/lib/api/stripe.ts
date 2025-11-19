/**
 * @fileoverview Stripe API client for subscription management
 *
 * Handles:
 * - Creating checkout sessions for subscription signup
 * - Checking subscription status and access permissions
 * - Creating customer portal sessions for subscription management
 *
 * All payment logic is server-side via Supabase Edge Functions.
 *
 * @module lib/api/stripe
 */

import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'

// ============================================================================
// Environment Variables
// ============================================================================

/**
 * Stripe publishable key for frontend operations
 */
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

/**
 * Default monthly subscription price ID
 */
const stripeMonthlyPriceId = import.meta.env.VITE_STRIPE_MONTHLY_PRICE_ID

// Validate required environment variables
if (!stripePublishableKey) {
  throw new Error('Missing VITE_STRIPE_PUBLISHABLE_KEY environment variable')
}

if (!stripeMonthlyPriceId) {
  throw new Error('Missing VITE_STRIPE_MONTHLY_PRICE_ID environment variable')
}

// ============================================================================
// Types
// ============================================================================

/**
 * Request payload for creating a checkout session
 */
export interface CreateCheckoutRequest {
  priceId?: string // Optional: override default price ID
  successUrl?: string // Optional: custom success redirect URL
  cancelUrl?: string // Optional: custom cancel redirect URL
}

/**
 * Response from create-checkout Edge Function
 */
export interface CreateCheckoutResponse {
  sessionUrl: string // Stripe Checkout URL to redirect user to
  sessionId: string // Stripe Checkout session ID
}

/**
 * Subscription status types
 */
export type SubscriptionStatus = 'trial' | 'active' | 'cancelled' | 'expired' | 'past_due'

/**
 * Response from check-subscription Edge Function
 */
export interface SubscriptionStatusResponse {
  hasAccess: boolean // Whether user has access to premium features
  status: SubscriptionStatus // Current subscription status
  trialEndsAt: string | null // ISO date when trial ends (null if no trial)
  subscriptionEndsAt: string | null // ISO date when subscription ends (null if no end date)
  daysRemaining: number | null // Days remaining in trial/subscription
  message: string // User-friendly status message
}

/**
 * Request payload for creating a portal session
 */
export interface CreatePortalRequest {
  returnUrl?: string // Optional: URL to return to after portal session
}

/**
 * Response from create-portal-session Edge Function
 */
export interface CreatePortalResponse {
  url: string // Stripe Customer Portal URL
}

/**
 * Custom error class for Stripe API errors
 */
export class StripeApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message)
    this.name = 'StripeApiError'
  }
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Creates a Stripe Checkout session for subscription signup
 *
 * @param request - Checkout session configuration
 * @returns Checkout session URLs and ID
 * @throws StripeApiError if checkout creation fails
 *
 * @example
 * ```typescript
 * const checkout = await createCheckoutSession({
 *   successUrl: '/subscription/success',
 *   cancelUrl: '/subscription/cancelled'
 * })
 * // Redirect user to checkout.sessionUrl
 * ```
 */
export async function createCheckoutSession(
  request: CreateCheckoutRequest = {}
): Promise<CreateCheckoutResponse> {
  logger.debug('Creating checkout session', { request })

  try {
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: request,
    })

    if (error) {
      logger.error('Checkout session creation failed', { error })
      throw new StripeApiError(error.message || 'Failed to create checkout session', error.status)
    }

    if (!data) {
      logger.error('No data returned from create-checkout function')
      throw new StripeApiError('No response data from checkout creation')
    }

    logger.debug('Checkout session created successfully', { sessionId: data.sessionId })
    return data as CreateCheckoutResponse
  } catch (error) {
    if (error instanceof StripeApiError) {
      throw error
    }

    logger.error('Unexpected error creating checkout session', { error })
    throw new StripeApiError(
      error instanceof Error ? error.message : 'Unknown error creating checkout session'
    )
  }
}

/**
 * Checks the current user's subscription status and access permissions
 *
 * @returns Current subscription status and access information
 * @throws StripeApiError if status check fails
 *
 * @example
 * ```typescript
 * const status = await checkSubscriptionStatus()
 * if (status.hasAccess) {
 *   // User has premium access
 *   console.log(status.message) // "Your subscription is active"
 * }
 * ```
 */
export async function checkSubscriptionStatus(): Promise<SubscriptionStatusResponse> {
  logger.debug('Checking subscription status')

  try {
    const { data, error } = await supabase.functions.invoke('check-subscription')

    if (error) {
      logger.error('Subscription status check failed', { error })
      throw new StripeApiError(error.message || 'Failed to check subscription status', error.status)
    }

    if (!data) {
      logger.error('No data returned from check-subscription function')
      throw new StripeApiError('No response data from subscription check')
    }

    logger.debug('Subscription status retrieved', {
      status: data.status,
      hasAccess: data.hasAccess,
    })
    return data as SubscriptionStatusResponse
  } catch (error) {
    if (error instanceof StripeApiError) {
      throw error
    }

    logger.error('Unexpected error checking subscription status', { error })
    throw new StripeApiError(
      error instanceof Error ? error.message : 'Unknown error checking subscription status'
    )
  }
}

/**
 * Creates a Stripe Customer Portal session for subscription management
 *
 * @param request - Portal session configuration
 * @returns Customer Portal URL
 * @throws StripeApiError if portal creation fails
 *
 * @example
 * ```typescript
 * const portal = await createPortalSession({
 *   returnUrl: '/settings/subscription'
 * })
 * // Redirect user to portal.url
 * ```
 */
export async function createPortalSession(
  request: CreatePortalRequest = {}
): Promise<CreatePortalResponse> {
  logger.debug('Creating portal session', { request })

  try {
    const { data, error } = await supabase.functions.invoke('create-portal-session', {
      body: request,
    })

    if (error) {
      logger.error('Portal session creation failed', { error })
      throw new StripeApiError(error.message || 'Failed to create portal session', error.status)
    }

    if (!data) {
      logger.error('No data returned from create-portal-session function')
      throw new StripeApiError('No response data from portal creation')
    }

    logger.debug('Portal session created successfully')
    return data as CreatePortalResponse
  } catch (error) {
    if (error instanceof StripeApiError) {
      throw error
    }

    logger.error('Unexpected error creating portal session', { error })
    throw new StripeApiError(
      error instanceof Error ? error.message : 'Unknown error creating portal session'
    )
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Gets the Stripe publishable key for frontend Stripe.js operations
 *
 * @returns Stripe publishable key
 */
export function getStripePublishableKey(): string {
  return stripePublishableKey
}

/**
 * Gets the default monthly subscription price ID
 *
 * @returns Stripe price ID
 */
export function getStripeMonthlyPriceId(): string {
  return stripeMonthlyPriceId
}
