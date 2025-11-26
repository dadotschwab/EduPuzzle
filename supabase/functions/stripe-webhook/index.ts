/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Edge Function: Stripe Webhook Handler (PUBLIC ENDPOINT)
 *
 * SECURITY CRITICAL: Handles all Stripe subscription events.
 * - Verifies webhook signatures (prevents spoofing)
 * - Updates subscription status in database
 * - Updates JWT metadata for instant access
 * - Handles payment failures and cancellations
 * - PUBLIC ACCESS: Uses webhook signature verification instead of auth headers
 *
 * Events handled:
 * - checkout.session.completed: New subscription created
 * - customer.subscription.updated: Subscription changed
 * - customer.subscription.deleted: Subscription cancelled
 * - invoice.payment_succeeded: Payment successful
 * - invoice.payment_failed: Payment failed
 *
 * @module functions/stripe-webhook
 */

declare const Deno: {
  env: {
    get(key: string): string | undefined
  }
  serve(handler: (request: Request) => Promise<Response>): void
}

// Follow Supabase's official Stripe webhook pattern
// @ts-expect-error - Deno imports not recognized by TypeScript
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
// @ts-expect-error - Deno imports not recognized by TypeScript
import Stripe from 'https://esm.sh/stripe@14?target=denonext'

// Import security middleware
import { checkRateLimit, createRateLimitResponse } from '../_middleware/rateLimit.ts'
import {
  validateStripeEvent,
  validateSubscriptionData,
  validateInvoiceData,
} from '../_shared/validation.ts'
import { detectSuspiciousPatterns, logSecurityEvent } from '../_shared/security.ts'
import { checkWebhookIdempotency, storeWebhookResult } from '../_shared/idempotency.ts'
import { withRetry, stripeCircuitBreaker } from '../_shared/retry.ts'
import { logger } from '../_shared/logger.ts'

// Initialize Stripe with proper configuration
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  // This is needed to use the Fetch API rather than relying on the Node http package
  apiVersion: '2024-11-20',
})

// This is needed in order to use the Web Crypto API in Deno
const cryptoProvider = Stripe.createSubtleCryptoProvider()

/**
 * Subscription status mapping
 */
type SubscriptionStatus = 'trial' | 'active' | 'cancelled' | 'expired' | 'past_due'

function mapStripeStatus(stripeStatus: string): SubscriptionStatus {
  switch (stripeStatus) {
    case 'active':
      return 'active'
    case 'trialing':
      // Stripe trialing subscriptions are paid subscriptions in trial period
      // Treat them as "active" to distinguish from app free trial
      return 'active'
    case 'canceled':
    case 'cancelled':
      return 'cancelled'
    case 'past_due':
      return 'past_due'
    case 'unpaid':
    case 'incomplete':
    case 'incomplete_expired':
      return 'expired'
    default:
      return 'expired'
  }
}

logger.info('Stripe Webhook initialized')

Deno.serve(async (request) => {
  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

  if (!stripeSecretKey || !webhookSecret) {
    logger.error('Missing required environment variables')
    return new Response('Server configuration error', { status: 500 })
  }

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  logger.info('Webhook request received', { method: request.method, url: request.url })

  // Security Layer 1: Rate Limiting
  if (checkRateLimit(request)) {
    logSecurityEvent('Rate limit exceeded', { ip: request.headers.get('x-forwarded-for') })
    return createRateLimitResponse()
  }

  // Security Layer 2: Suspicious Pattern Detection
  const warnings = detectSuspiciousPatterns(request)
  if (warnings.length > 0) {
    logSecurityEvent('Suspicious request patterns detected', { warnings })
    // Continue processing but log warnings
  }

  try {
    // Get Stripe signature from headers
    const signature = request.headers.get('Stripe-Signature')
    if (!signature) {
      logger.error('No Stripe signature in request headers')
      return new Response('Missing Stripe signature', { status: 400 })
    }

    // First step is to verify the event. The .text() method must be used as the
    // verification relies on the raw request body rather than the parsed JSON.
    const body = await request.text()

    let receivedEvent: Stripe.Event
    try {
      receivedEvent = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        Deno.env.get('STRIPE_WEBHOOK_SECRET')!,
        undefined,
        cryptoProvider
      )
    } catch (err: any) {
      logger.error('Webhook signature verification failed:', err.message)
      return new Response(err.message, { status: 400 })
    }

    logger.info(`Event received: ${receivedEvent.id} - Type: ${receivedEvent.type}`, {
      customer: receivedEvent.data.object.customer,
      subscription: receivedEvent.data.object.subscription,
      amount:
        (receivedEvent.data.object as any).amount_total ||
        (receivedEvent.data.object as any).amount,
      status: (receivedEvent.data.object as any).status,
    })

    // Security Layer 3: Idempotency Check
    const idempotencyCheck = await checkWebhookIdempotency(receivedEvent.id)
    if (idempotencyCheck.isDuplicate) {
      logger.info(`Duplicate webhook event ${receivedEvent.id}, skipping processing`)
      return new Response('Event already processed', { status: 200 })
    }

    // Security Layer 4: Event Validation
    const eventValidation = validateStripeEvent(receivedEvent)
    if (!eventValidation.success) {
      logSecurityEvent('Invalid webhook event structure', {
        eventId: receivedEvent.id,
        error: eventValidation.error,
      })
      return new Response('Invalid event structure', { status: 400 })
    }

    // Security Layer 5: Event Data Validation
    let dataValidation: { success: boolean; error?: string }
    if (receivedEvent.type.includes('subscription')) {
      dataValidation = validateSubscriptionData(receivedEvent.data.object)
    } else if (receivedEvent.type.includes('invoice')) {
      dataValidation = validateInvoiceData(receivedEvent.data.object)
    } else {
      dataValidation = { success: true } // Skip validation for other event types
    }

    if (!dataValidation.success) {
      logSecurityEvent('Invalid webhook event data', {
        eventId: receivedEvent.id,
        eventType: receivedEvent.type,
        error: dataValidation.error,
      })
      return new Response('Invalid event data', { status: 400 })
    }

    // Security Layer 6: Circuit Breaker + Retry Logic
    const processEvent = async () => {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Supabase configuration missing')
      }

      const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)

      // Process event based on its type
      // Check if event was already processed
      const { data: existingEvent, error: eventCheckError } = await supabaseClient
        .from('stripe_webhook_events')
        .select('processed_at')
        .eq('event_id', receivedEvent.id)
        .single()

      if (existingEvent) {
        logger.info(
          `Event ${receivedEvent.id} already processed at ${existingEvent.processed_at}, skipping`
        )
        return new Response(JSON.stringify({ ok: true, skipped: true }), { status: 200 })
      }

      if (eventCheckError && eventCheckError.code !== 'PGRST116') {
        // PGRST116 = no rows found
        logger.error('Error checking for duplicate event:', eventCheckError)
        // Continue processing but log the error
      }

      // Handle different event types
      let processingResult: { userId: string; newStatus: string } | null = null
      switch (receivedEvent.type) {
        case 'checkout.session.completed': {
          const session = receivedEvent.data.object as Stripe.Checkout.Session
          processingResult = await handleCheckoutCompleted(supabaseClient, stripe, session)
          break
        }

        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const subscription = receivedEvent.data.object as Stripe.Subscription
          processingResult = await handleSubscriptionUpdated(supabaseClient, subscription)
          break
        }

        case 'customer.subscription.deleted': {
          const subscription = receivedEvent.data.object as Stripe.Subscription
          processingResult = await handleSubscriptionDeleted(supabaseClient, subscription)
          break
        }

        case 'invoice.payment_succeeded': {
          const invoice = receivedEvent.data.object as Stripe.Invoice
          processingResult = await handlePaymentSucceeded(supabaseClient, stripe, invoice)
          break
        }

        case 'invoice.payment_failed': {
          const invoice = receivedEvent.data.object as Stripe.Invoice
          processingResult = await handlePaymentFailed(supabaseClient, invoice)
          break
        }

        default:
          logger.warn(`Unhandled event type: ${receivedEvent.type}`)
      }

      // Log successful event processing for deduplication
      const eventData = receivedEvent.data.object
      await supabaseClient.from('stripe_webhook_events').insert({
        event_id: receivedEvent.id,
        event_type: receivedEvent.type,
        customer_id: eventData.customer,
        subscription_id: eventData.subscription,
        user_id: processingResult?.userId,
      })

      logger.info(`Successfully processed event: ${receivedEvent.type}`, {
        eventId: receivedEvent.id,
        customerId: eventData.customer,
        userId: processingResult?.userId,
        newStatus: processingResult?.newStatus,
      })

      // Store successful processing result for idempotency
      storeWebhookResult(receivedEvent.id, { success: true })

      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    }

    // Execute with circuit breaker and retry logic
    return await withRetry(() => stripeCircuitBreaker.execute(processEvent), {
      maxRetries: 3,
      baseDelay: 1000,
      retryableErrors: (error) => {
        // Retry on database connection issues, temporary Stripe issues, etc.
        return Boolean(
          error?.message?.includes('connection') ||
            error?.message?.includes('timeout') ||
            (error?.status && error.status >= 500)
        )
      },
    })
  } catch (error) {
    logger.error('❌ Webhook error:', error)
    logger.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    logger.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      type: typeof error,
      keys: error instanceof Object ? Object.keys(error) : [],
    })

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
        details: error instanceof Error ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})

/**
 * Handle successful checkout completion
 * Creates or updates user subscription status
 */
async function handleCheckoutCompleted(
  supabase: SupabaseClient,
  stripe: Stripe,
  session: Stripe.Checkout.Session
): Promise<{ userId: string; newStatus: string } | null> {
  logger.info('Handling checkout.session.completed', { sessionId: session.id })

  const customerId = session.customer as string
  const subscriptionId = session.subscription as string
  const userId = session.metadata?.supabase_user_id

  if (!userId) {
    logger.error('No supabase_user_id in session metadata')
    return null
  }

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)

  // Calculate subscription end date
  const subscriptionEndDate = new Date(subscription.current_period_end * 1000)
  const newStatus = mapStripeStatus(subscription.status)

  // Update user record
  const { error } = await supabase
    .from('users')
    .update({
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      subscription_status: newStatus,
      subscription_end_date: subscriptionEndDate.toISOString(),
    })
    .eq('id', userId)

  if (error) {
    logger.error('Failed to update user after checkout:', error)
    throw error
  }

  logger.info(`User subscription status updated`, { userId, newStatus })

  // Update user JWT metadata with new subscription status
  await updateUserSubscriptionMetadata(userId)

  return { userId, newStatus }
}

/**
 * Handle subscription updates (renewals, changes, etc.)
 */
async function handleSubscriptionUpdated(
  supabase: SupabaseClient,
  subscription: Stripe.Subscription
): Promise<{ userId: string; newStatus: string } | null> {
  logger.info('Handling subscription update', { subscriptionId: subscription.id })

  const customerId = subscription.customer as string
  const userId = subscription.metadata?.supabase_user_id

  // Try to find user by Stripe customer ID or metadata
  let userQuery = supabase.from('users').select('id')

  if (userId) {
    userQuery = userQuery.eq('id', userId)
  } else {
    userQuery = userQuery.eq('stripe_customer_id', customerId)
  }

  const { data: user, error: userError } = await userQuery.single()

  if (userError || !user) {
    logger.error('Could not find user for subscription:', subscription.id)
    return null
  }

  // Calculate subscription end date
  const subscriptionEndDate = new Date(subscription.current_period_end * 1000)
  const newStatus = mapStripeStatus(subscription.status)

  // Update user subscription status
  const { error } = await supabase
    .from('users')
    .update({
      stripe_subscription_id: subscription.id,
      subscription_status: newStatus,
      subscription_end_date: subscriptionEndDate.toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    logger.error('Failed to update subscription status:', error)
    throw error
  }

  logger.info(`User subscription updated`, { userId: user.id, newStatus })

  // Update user JWT metadata with new subscription status
  await updateUserSubscriptionMetadata(user.id)

  return { userId: user.id, newStatus }
}

/**
 * Handle subscription deletion (cancellation)
 */
async function handleSubscriptionDeleted(
  supabase: SupabaseClient,
  subscription: Stripe.Subscription
): Promise<{ userId: string; newStatus: string } | null> {
  logger.info('Handling subscription deletion', { subscriptionId: subscription.id })

  const customerId = subscription.customer as string

  // Find user by Stripe customer ID
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (userError || !user) {
    logger.error('Could not find user for cancelled subscription')
    return null
  }

  // Update user to cancelled status
  const { error } = await supabase
    .from('users')
    .update({
      subscription_status: 'cancelled',
      subscription_end_date: new Date(subscription.ended_at! * 1000).toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    logger.error('Failed to mark subscription as cancelled:', error)
    throw error
  }

  logger.info(`User subscription cancelled`, { userId: user.id })

  // Update user JWT metadata with new subscription status
  await updateUserSubscriptionMetadata(user.id)

  return { userId: user.id, newStatus: 'cancelled' }
}

/**
 * Handle successful payment (renewal)
 */
async function handlePaymentSucceeded(
  supabase: SupabaseClient,
  stripe: Stripe,
  invoice: Stripe.Invoice
): Promise<{ userId: string; newStatus: string } | null> {
  logger.info('Handling payment success', { invoiceId: invoice.id })

  // Only process subscription invoices
  if (!invoice.subscription) {
    return null
  }

  const customerId = invoice.customer as string

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)

  // Find user by Stripe customer ID
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (userError || !user) {
    logger.error('Could not find user for payment')
    return null
  }

  // Update subscription end date
  const subscriptionEndDate = new Date(subscription.current_period_end * 1000)
  const newStatus = mapStripeStatus(subscription.status)

  const { error } = await supabase
    .from('users')
    .update({
      subscription_status: newStatus,
      subscription_end_date: subscriptionEndDate.toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    logger.error('Failed to update after payment success:', error)
    throw error
  }

  logger.info(`User payment processed successfully`, { userId: user.id, newStatus })

  // Update user JWT metadata with new subscription status
  await updateUserSubscriptionMetadata(user.id)

  return { userId: user.id, newStatus }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(
  supabase: SupabaseClient,
  invoice: Stripe.Invoice
): Promise<{ userId: string; newStatus: string } | null> {
  logger.info('Handling payment failure', { invoiceId: invoice.id })

  const customerId = invoice.customer as string

  // Find user by Stripe customer ID
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (userError || !user) {
    logger.error('Could not find user for failed payment')
    return null
  }

  // Update status to past_due
  const { error } = await supabase
    .from('users')
    .update({
      subscription_status: 'past_due',
    })
    .eq('id', user.id)

  if (error) {
    logger.error('Failed to update after payment failure:', error)
    throw error
  }

  logger.warn(`User payment failed - marked as past_due`, { userId: user.id })

  // Update user JWT metadata with new subscription status
  await updateUserSubscriptionMetadata(user.id)

  return { userId: user.id, newStatus: 'past_due' }
}

/**
 * Update user subscription metadata in JWT
 */
async function updateUserSubscriptionMetadata(userId: string): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      logger.error('Missing Supabase configuration for metadata update')
      return
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/update-user-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ userId }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error('Failed to update user subscription metadata:', {
        userId,
        status: response.status,
        error: errorText,
      })
    } else {
      logger.info('Successfully updated user subscription metadata:', { userId })
    }
  } catch (error) {
    logger.error('Error updating user subscription metadata:', { userId, error })
  }
}
