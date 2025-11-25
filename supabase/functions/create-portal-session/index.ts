/**
 * Edge Function: Create Stripe Customer Portal Session
 *
 * Creates a Stripe Customer Portal session for subscription management.
 * Allows users to:
 * - Update payment method
 * - View invoices
 * - Cancel subscription
 * - Update billing details
 *
 * @module functions/create-portal-session
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

interface PortalRequest {
  returnUrl?: string
}

interface PortalResponse {
  url: string
}

/**
 * Validates portal session request data
 */
function validatePortalRequest(
  body: unknown
): { success: true; data: PortalRequest } | { success: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { success: false, error: 'Request body must be an object' }
  }

  const req = body as Record<string, unknown>

  // Validate returnUrl if provided
  if (req.returnUrl !== undefined) {
    if (typeof req.returnUrl !== 'string' || req.returnUrl.trim().length === 0) {
      return { success: false, error: 'returnUrl must be a non-empty string' }
    }

    // Validate URL format
    try {
      const url = new URL(req.returnUrl)
      // Only allow http and https protocols
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return { success: false, error: 'returnUrl must use http or https protocol' }
      }
    } catch {
      return { success: false, error: 'returnUrl must be a valid URL' }
    }
  }

  return {
    success: true,
    data: {
      returnUrl: req.returnUrl as string | undefined,
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

    const validation = validatePortalRequest(rawBody)
    if (!validation.success) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = validation.data

    const returnUrl = body.returnUrl || `${req.headers.get('origin')}/settings/subscription`

    // 5. Get user's Stripe customer ID
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (userError) {
      throw new Error(`Failed to fetch user data: ${userError.message}`)
    }

    if (!userData.stripe_customer_id) {
      return new Response(JSON.stringify({ error: 'No active subscription found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 6. Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: userData.stripe_customer_id,
      return_url: returnUrl,
    })

    // 7. Return portal URL
    const response: PortalResponse = {
      url: session.url,
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    logger.error('Error creating portal session', error)

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
