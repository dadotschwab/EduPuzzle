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

// Import with explicit Deno compatibility
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno'

/**
 * CORS headers (webhooks don't need CORS but include for consistency)
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Subscription status mapping
 */
type SubscriptionStatus = 'trial' | 'active' | 'cancelled' | 'expired' | 'past_due'

function mapStripeStatus(stripeStatus: string): SubscriptionStatus {
  switch (stripeStatus) {
    case 'active':
      return 'active'
    case 'trialing':
      return 'trial'
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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // IMPORTANT: For webhooks, we bypass normal auth and use signature verification instead
  console.log('Webhook request received:', req.method, req.url)
  
  // Check if this is a webhook request (has stripe-signature header)
  const stripeSignature = req.headers.get('stripe-signature')
  if (!stripeSignature) {
    return new Response(
      JSON.stringify({ error: 'Missing Stripe signature' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  try {
    // 1. Validate webhook secret
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET not configured')
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY not configured')
    }

    // 2. Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // 3. Get webhook signature
    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'No signature provided' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // 4. Get raw body for signature verification
    const body = await req.text()

    // 5. Verify webhook signature (CRITICAL SECURITY CHECK)
    let event: Stripe.Event
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      )
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // 6. Initialize Supabase client (service role for admin access)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing')
    }
    
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)

    console.log(`Processing webhook event: ${event.type}`)

    // 7. Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(supabaseClient, stripe, session)
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(supabaseClient, subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(supabaseClient, subscription)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentSucceeded(supabaseClient, stripe, invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(supabaseClient, invoice)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    // 8. Return success response
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
) {
  console.log('Handling checkout.session.completed:', session.id)

  const customerId = session.customer as string
  const subscriptionId = session.subscription as string
  const userId = session.metadata?.supabase_user_id

  if (!userId) {
    console.error('No supabase_user_id in session metadata')
    return
  }

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)

  // Calculate subscription end date
  const subscriptionEndDate = new Date(subscription.current_period_end * 1000)

  // Update user record
  const { error } = await supabase
    .from('users')
    .update({
      stripe_customer_id: customerId,
      subscription_status: mapStripeStatus(subscription.status),
      subscription_end_date: subscriptionEndDate.toISOString(),
    })
    .eq('id', userId)

  if (error) {
    console.error('Failed to update user after checkout:', error)
    throw error
  }

  console.log(`User ${userId} subscription activated`)
}

/**
 * Handle subscription updates (renewals, changes, etc.)
 */
async function handleSubscriptionUpdated(
  supabase: any,
  subscription: Stripe.Subscription
) {
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
    return
  }

  // Calculate subscription end date
  const subscriptionEndDate = new Date(subscription.current_period_end * 1000)

  // Update user subscription status
  const { error } = await supabase
    .from('users')
    .update({
      subscription_status: mapStripeStatus(subscription.status),
      subscription_end_date: subscriptionEndDate.toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    console.error('Failed to update subscription status:', error)
    throw error
  }

  console.log(`User ${user.id} subscription updated to ${subscription.status}`)
}

/**
 * Handle subscription deletion (cancellation)
 */
async function handleSubscriptionDeleted(
  supabase: any,
  subscription: Stripe.Subscription
) {
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
    return
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
}

/**
 * Handle successful payment (renewal)
 */
async function handlePaymentSucceeded(
  supabase: any,
  stripe: Stripe,
  invoice: Stripe.Invoice
) {
  console.log('Handling payment success:', invoice.id)

  // Only process subscription invoices
  if (!invoice.subscription) {
    return
  }

  const customerId = invoice.customer as string

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(
    invoice.subscription as string
  )

  // Find user by Stripe customer ID
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (userError || !user) {
    console.error('Could not find user for payment')
    return
  }

  // Update subscription end date
  const subscriptionEndDate = new Date(subscription.current_period_end * 1000)

  const { error } = await supabase
    .from('users')
    .update({
      subscription_status: 'active',
      subscription_end_date: subscriptionEndDate.toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    console.error('Failed to update after payment success:', error)
    throw error
  }

  console.log(`User ${user.id} payment processed successfully`)
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(
  supabase: any,
  invoice: Stripe.Invoice
) {
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
    return
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
}
