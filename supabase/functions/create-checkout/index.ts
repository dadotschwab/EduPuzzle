/**
 * Edge Function: Create Stripe Checkout Session
 *
 * Creates a Stripe Checkout session for subscription with 7-day trial.
 * Follows server-first architecture - all payment logic on server.
 *
 * @module functions/create-checkout
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno'
import { logger } from '../_shared/logger.ts'

/**
 * CORS headers for Edge Function
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CheckoutRequest {
  priceId?: string // Optional: override default price
  successUrl?: string
  cancelUrl?: string
}

interface CheckoutResponse {
  sessionUrl: string
  sessionId: string
}

/**
 * Validates checkout request data
 */
function validateCheckoutRequest(
  body: unknown
): { success: true; data: CheckoutRequest } | { success: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { success: false, error: 'Request body must be an object' }
  }

  const req = body as Record<string, unknown>

  // Validate priceId if provided
  if (req.priceId !== undefined) {
    if (typeof req.priceId !== 'string' || req.priceId.trim().length === 0) {
      return { success: false, error: 'priceId must be a non-empty string' }
    }

    // Validate Stripe price ID format (starts with price_)
    if (!req.priceId.startsWith('price_')) {
      return {
        success: false,
        error: 'priceId must be a valid Stripe price ID (starts with price_)',
      }
    }
  }

  // Validate successUrl if provided
  if (req.successUrl !== undefined) {
    if (typeof req.successUrl !== 'string' || req.successUrl.trim().length === 0) {
      return { success: false, error: 'successUrl must be a non-empty string' }
    }

    // Validate URL format
    try {
      new URL(req.successUrl)
    } catch {
      return { success: false, error: 'successUrl must be a valid URL' }
    }
  }

  // Validate cancelUrl if provided
  if (req.cancelUrl !== undefined) {
    if (typeof req.cancelUrl !== 'string' || req.cancelUrl.trim().length === 0) {
      return { success: false, error: 'cancelUrl must be a non-empty string' }
    }

    // Validate URL format
    try {
      new URL(req.cancelUrl)
    } catch {
      return { success: false, error: 'cancelUrl must be a valid URL' }
    }
  }

  return {
    success: true,
    data: {
      priceId: req.priceId as string | undefined,
      successUrl: req.successUrl as string | undefined,
      cancelUrl: req.cancelUrl as string | undefined,
    },
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Validate Stripe configuration
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY not configured')
    }

    const defaultPriceId = Deno.env.get('STRIPE_MONTHLY_PRICE_ID')
    if (!defaultPriceId) {
      throw new Error('STRIPE_MONTHLY_PRICE_ID not configured')
    }

    // 2. Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // 3. Get authenticated user using service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing')
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Extract token from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const token = authHeader.replace('Bearer ', '')

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      logger.error('Authentication failed', authError)
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 4. Parse and validate request body
    const rawBody = req.method === 'POST' ? await req.json() : {}

    const validation = validateCheckoutRequest(rawBody)
    if (!validation.success) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = validation.data

    const priceId = body.priceId || defaultPriceId
    const successUrl =
      body.successUrl ||
      `${req.headers.get('origin')}/subscription/success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = body.cancelUrl || `${req.headers.get('origin')}/subscription/cancelled`

    // 5. Get user data from database
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('email, stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (userError) {
      throw new Error(`Failed to fetch user data: ${userError.message}`)
    }

    // 6. Get or create Stripe customer
    let customerId = userData.stripe_customer_id

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: userData.email,
        metadata: {
          supabase_user_id: user.id,
        },
      })

      customerId = customer.id

      // Save customer ID to database
      const { error: updateError } = await supabaseClient
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)

      if (updateError) {
        logger.error('Failed to save stripe_customer_id', updateError)
        // Continue anyway - webhook will handle this on successful payment
      }
    }

    // 7. Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        // No trial period - users already had 7-day app trial
        // trial_period_days: 7,
        metadata: {
          supabase_user_id: user.id,
        },
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      customer_update: {
        address: 'auto',
      },
      metadata: {
        supabase_user_id: user.id,
      },
    })

    // 8. Return checkout URL
    const response: CheckoutResponse = {
      sessionUrl: session.url!,
      sessionId: session.id,
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    logger.error('Error creating checkout session', error)

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
