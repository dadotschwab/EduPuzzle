/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Edge Function: Stripe Webhook Handler (PUBLIC ENDPOINT)
 *
 * SECURITY CRITICAL: Handles all Stripe subscription events.
 * - Verifies webhook signatures (prevents spoofing)
 * - Updates subscription status in database
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
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
// @ts-expect-error - Deno imports not recognized by TypeScript
import Stripe from 'https://esm.sh/stripe@14?target=denonext'

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

console.log('Hello from Stripe Webhook!')

Deno.serve(async (request) => {
  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

  if (!stripeSecretKey || !webhookSecret) {
    console.error('Missing required environment variables')
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

  console.log('Webhook request received:', request.method, request.url)

  try {
    // Get Stripe signature from headers
    const signature = request.headers.get('Stripe-Signature')
    if (!signature) {
      console.error('No Stripe signature in request headers')
      return new Response('Missing Stripe signature', { status: 400 })
    }

    // First step is to verify the event. The .text() method must be used as the
    // verification relies on the raw request body rather than the parsed JSON.
    const body = await request.text()

    let receivedEvent
    try {
      receivedEvent = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        Deno.env.get('STRIPE_WEBHOOK_SECRET')!,
        undefined,
        cryptoProvider
      )
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message)
      return new Response(err.message, { status: 400 })
    }

    console.log(`🔔 Event received: ${receivedEvent.id} - Type: ${receivedEvent.type}`, {
      customer: receivedEvent.data.object.customer,
      subscription: receivedEvent.data.object.subscription,
      amount: receivedEvent.data.object.amount_total || receivedEvent.data.object.amount,
      status: receivedEvent.data.object.status,
    })

    // Initialize Supabase client (service role for admin access)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing')
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)

    // Check for duplicate event processing (idempotency)
    const { data: existingEvent, error: eventCheckError } = await supabaseClient
      .from('stripe_webhook_events')
      .select('id, processed_at')
      .eq('event_id', receivedEvent.id)
      .single()

    if (existingEvent) {
      console.log(
        `Event ${receivedEvent.id} already processed at ${existingEvent.processed_at}, skipping`
      )
      return new Response(JSON.stringify({ ok: true, skipped: true }), { status: 200 })
    }

    if (eventCheckError && eventCheckError.code !== 'PGRST116') {
      // PGRST116 = no rows found
      console.error('Error checking for duplicate event:', eventCheckError)
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
        console.log(`Unhandled event type: ${receivedEvent.type}`)
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

    console.log(`✅ Successfully processed event: ${receivedEvent.type}`, {
      eventId: receivedEvent.id,
      customerId: eventData.customer,
      userId: processingResult?.userId,
      newStatus: processingResult?.newStatus,
    })

    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  } catch (error) {
    console.error('❌ Webhook error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('Error details:', {
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
  supabase: any,
  stripe: Stripe,
  session: Stripe.Checkout.Session
): Promise<{ userId: string; newStatus: string } | null> {
  console.log('Handling checkout.session.completed:', session.id)

  const customerId = session.customer as string
  const subscriptionId = session.subscription as string
  const userId = session.metadata?.supabase_user_id

  if (!userId) {
    console.error('No supabase_user_id in session metadata')
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
      subscription_status: newStatus,
      subscription_end_date: subscriptionEndDate.toISOString(),
    })
    .eq('id', userId)

  if (error) {
    console.error('Failed to update user after checkout:', error)
    throw error
  }

  console.log(`User ${userId} subscription status set to ${newStatus}`)
  return { userId, newStatus }
}

/**
 * Handle subscription updates (renewals, changes, etc.)
 */
async function handleSubscriptionUpdated(
  supabase: any,
  subscription: Stripe.Subscription
): Promise<{ userId: string; newStatus: string } | null> {
  console.log('Handling subscription update:', subscription.id)

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
    console.error('Could not find user for subscription:', subscription.id)
    return null
  }

  // Calculate subscription end date
  const subscriptionEndDate = new Date(subscription.current_period_end * 1000)
  const newStatus = mapStripeStatus(subscription.status)

  // Update user subscription status
  const { error } = await supabase
    .from('users')
    .update({
      subscription_status: newStatus,
      subscription_end_date: subscriptionEndDate.toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    console.error('Failed to update subscription status:', error)
    throw error
  }

  console.log(`User ${user.id} subscription updated to ${newStatus}`)
  return { userId: user.id, newStatus }
}

/**
 * Handle subscription deletion (cancellation)
 */
async function handleSubscriptionDeleted(
  supabase: any,
  subscription: Stripe.Subscription
): Promise<{ userId: string; newStatus: string } | null> {
  console.log('Handling subscription deletion:', subscription.id)

  const customerId = subscription.customer as string

  // Find user by Stripe customer ID
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (userError || !user) {
    console.error('Could not find user for cancelled subscription')
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
    console.error('Failed to mark subscription as cancelled:', error)
    throw error
  }

  console.log(`User ${user.id} subscription cancelled`)
  return { userId: user.id, newStatus: 'cancelled' }
}

/**
 * Handle successful payment (renewal)
 */
async function handlePaymentSucceeded(
  supabase: any,
  stripe: Stripe,
  invoice: Stripe.Invoice
): Promise<{ userId: string; newStatus: string } | null> {
  console.log('Handling payment success:', invoice.id)

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
    console.error('Could not find user for payment')
    return null
  }

  // Update subscription end date
  const subscriptionEndDate = new Date(subscription.current_period_end * 1000)
  const newStatus = mapStripeStatus(subscription.status) // Fixed: Use mapStripeStatus instead of hardcoded 'active'

  const { error } = await supabase
    .from('users')
    .update({
      subscription_status: newStatus,
      subscription_end_date: subscriptionEndDate.toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    console.error('Failed to update after payment success:', error)
    throw error
  }

  console.log(`User ${user.id} payment processed successfully, status: ${newStatus}`)
  return { userId: user.id, newStatus }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(
  supabase: any,
  invoice: Stripe.Invoice
): Promise<{ userId: string; newStatus: string } | null> {
  console.log('Handling payment failure:', invoice.id)

  const customerId = invoice.customer as string

  // Find user by Stripe customer ID
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (userError || !user) {
    console.error('Could not find user for failed payment')
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
    console.error('Failed to update after payment failure:', error)
    throw error
  }

  console.log(`User ${user.id} payment failed - marked as past_due`)
  return { userId: user.id, newStatus: 'past_due' }
}
