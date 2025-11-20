/**
 * Edge Function: Check Subscription Status
 *
 * Returns the current subscription status and access permissions for a user.
 * Determines if user has access based on:
 * - Active subscription
 * - Trial period
 * - Payment status
 *
 * @module functions/check-subscription
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno'

/**
 * CORS headers for Edge Function
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SubscriptionStatusResponse {
  hasAccess: boolean
  status: 'trial' | 'active' | 'cancelled' | 'expired' | 'past_due'
  trialEndsAt: string | null
  subscriptionEndsAt: string | null
  daysRemaining: number | null
  message: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Check for Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('[check-subscription] No Authorization header found')
      return new Response(JSON.stringify({ error: 'No Authorization header provided' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(
      '[check-subscription] Authorization header present:',
      authHeader.substring(0, 20) + '...'
    )

    // 2. Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      console.error('[check-subscription] Missing Supabase environment variables')
      console.error('[check-subscription] Has URL:', !!supabaseUrl)
      console.error('[check-subscription] Has Anon Key:', !!supabaseAnonKey)
      console.error('[check-subscription] Has Service Key:', !!supabaseServiceKey)
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('[check-subscription] Environment variables loaded successfully')

    // 3. Create service client for authentication validation
    // Use service role to verify the JWT directly
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    console.log('[check-subscription] Service client created, validating token...')

    // 4. Extract token from Authorization header
    const token = authHeader.replace('Bearer ', '')

    // 5. Validate user authentication using service role client
    const {
      data: { user },
      error: authError,
    } = await serviceClient.auth.getUser(token)

    if (authError) {
      console.error('[check-subscription] Auth error:', authError.message)
      console.error('[check-subscription] Auth error status:', authError.status)
      console.error('[check-subscription] Auth error code:', authError.code)
      return new Response(
        JSON.stringify({
          error: 'Authentication failed',
          details: authError.message,
          code: authError.code,
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (!user) {
      console.error('[check-subscription] No user found after auth')
      return new Response(JSON.stringify({ error: 'No user found' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`[check-subscription] User authenticated: ${user.id}`)

    // 6. Get user subscription data with service role (bypasses RLS)
    const { data: userData, error: userError } = await serviceClient
      .from('users')
      .select('subscription_status, trial_end_date, subscription_end_date')
      .eq('id', user.id)
      .maybeSingle()

    if (userError) {
      console.error('[check-subscription] Database query error:', userError.message)
      return new Response(JSON.stringify({ error: 'Database query failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 7. Create user record if it doesn't exist (using service role)
    if (!userData) {
      console.log(`[check-subscription] User record not found for ${user.id}, creating...`)

      // Create user with trial status
      const trialEndDate = new Date()
      trialEndDate.setDate(trialEndDate.getDate() + 7) // 7-day trial

      const { data: newUser, error: createError } = await serviceClient
        .from('users')
        .insert({
          id: user.id,
          email: user.email!,
          subscription_status: 'trial',
          trial_end_date: trialEndDate.toISOString(),
        })
        .select('subscription_status, trial_end_date, subscription_end_date')
        .single()

      if (createError || !newUser) {
        console.error('[check-subscription] Failed to create user record:', createError)
        return new Response(JSON.stringify({ error: 'Failed to create user record' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Return early with trial access
      return new Response(
        JSON.stringify({
          hasAccess: true,
          status: 'trial',
          trialEndsAt: trialEndDate.toISOString(),
          subscriptionEndsAt: null,
          daysRemaining: 7,
          message: 'Welcome! You have 7 days left in your trial',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // 8. Determine access and status
    const now = new Date()
    const trialEndDate = userData.trial_end_date ? new Date(userData.trial_end_date) : null
    const subscriptionEndDate = userData.subscription_end_date
      ? new Date(userData.subscription_end_date)
      : null

    let hasAccess = false
    let daysRemaining: number | null = null
    let message = ''
    let status = userData.subscription_status as SubscriptionStatusResponse['status']

    // 9. Check access based on subscription status
    switch (userData.subscription_status) {
      case 'active':
        hasAccess = true
        if (subscriptionEndDate) {
          daysRemaining = Math.ceil(
            (subscriptionEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          )
          message = 'Your subscription is active'
        }
        break

      case 'trial':
        // Check if trial is still valid
        if (trialEndDate && trialEndDate > now) {
          hasAccess = true
          daysRemaining = Math.ceil(
            (trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          )
          message = `You have ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left in your trial`
        } else {
          // Trial expired - but check if user has active Stripe subscription before marking as expired
          if (userData.stripe_customer_id && stripeSecretKey) {
            try {
              console.log(
                '[check-subscription] Trial expired, checking Stripe for active subscription...'
              )

              // Initialize Stripe
              const stripe = new Stripe(stripeSecretKey, {
                apiVersion: '2023-10-16',
                httpClient: Stripe.createFetchHttpClient(),
              })

              // Check for active subscriptions
              const subscriptions = await stripe.subscriptions.list({
                customer: userData.stripe_customer_id,
                status: 'active',
                limit: 1,
              })

              if (subscriptions.data.length > 0) {
                // User has active paid subscription despite expired trial
                console.log(
                  '[check-subscription] Found active Stripe subscription, upgrading user status'
                )
                hasAccess = true
                status = 'active'
                const subscription = subscriptions.data[0]
                const subscriptionEndDate = new Date(subscription.current_period_end * 1000)

                // Update database to reflect correct status
                await serviceClient
                  .from('users')
                  .update({
                    subscription_status: 'active',
                    subscription_end_date: subscriptionEndDate.toISOString(),
                  })
                  .eq('id', user.id)

                daysRemaining = Math.ceil(
                  (subscriptionEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                )
                message = 'Your subscription is active'
                break
              }
            } catch (stripeError) {
              console.error('[check-subscription] Stripe verification failed:', stripeError)
              // Continue with normal trial expiry logic if Stripe check fails
            }
          }

          // Trial expired and no active subscription found
          hasAccess = false
          status = 'expired'
          message = 'Your trial has expired. Please subscribe to continue.'
        }
        break

      case 'cancelled':
        // Check if cancelled subscription still has time remaining
        if (subscriptionEndDate && subscriptionEndDate > now) {
          hasAccess = true
          daysRemaining = Math.ceil(
            (subscriptionEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          )
          message = `Your subscription is cancelled but active until ${subscriptionEndDate.toLocaleDateString()}`
        } else {
          hasAccess = false
          message = 'Your subscription has been cancelled'
        }
        break

      case 'past_due':
        // Grace period - still give access but warn
        hasAccess = true
        message = 'Your payment failed. Please update your payment method to avoid interruption.'
        break

      case 'expired':
      default:
        hasAccess = false
        message = 'Your subscription has expired. Please subscribe to continue.'
        break
    }

    // 10. Return subscription status
    const response: SubscriptionStatusResponse = {
      hasAccess,
      status,
      trialEndsAt: trialEndDate?.toISOString() || null,
      subscriptionEndsAt: subscriptionEndDate?.toISOString() || null,
      daysRemaining,
      message,
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error checking subscription:', error)

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
