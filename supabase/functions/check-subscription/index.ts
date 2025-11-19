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
      return new Response(
        JSON.stringify({ error: 'No Authorization header provided' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('[check-subscription] Authorization header present')

    // 2. Get authenticated user
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[check-subscription] Missing Supabase environment variables')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const supabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser()

    if (authError) {
      console.error('[check-subscription] Auth error:', authError.message)
      return new Response(
        JSON.stringify({
          error: 'Authentication failed',
          details: authError.message
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (!user) {
      console.error('[check-subscription] No user found after auth')
      return new Response(
        JSON.stringify({ error: 'No user found' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`[check-subscription] User authenticated: ${user.id}`)

    // 3. Get user subscription data (use maybeSingle to handle missing records)
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('subscription_status, trial_end_date, subscription_end_date')
      .eq('id', user.id)
      .maybeSingle()

    if (userError) {
      throw new Error(`Failed to fetch user data: ${userError.message}`)
    }

    // 4. DEFENSIVE: Create user record if it doesn't exist
    if (!userData) {
      console.log(`[check-subscription] User record not found for ${user.id}, creating...`)

      // Create user with trial status
      const trialEndDate = new Date()
      trialEndDate.setDate(trialEndDate.getDate() + 7) // 7-day trial

      const { data: newUser, error: createError } = await supabaseClient
        .from('users')
        .insert({
          id: user.id,
          email: user.email!,
          subscription_status: 'trial',
          trial_end_date: trialEndDate.toISOString(),
          created_at: new Date().toISOString(),
        })
        .select('subscription_status, trial_end_date, subscription_end_date')
        .single()

      if (createError || !newUser) {
        console.error('[check-subscription] Failed to create user record:', createError)
        throw new Error(`Failed to create user record: ${createError?.message}`)
      }

      // Use the newly created user data
      const userData = newUser

      // Return early with trial access
      return new Response(JSON.stringify({
        hasAccess: true,
        status: 'trial',
        trialEndsAt: trialEndDate.toISOString(),
        subscriptionEndsAt: null,
        daysRemaining: 7,
        message: 'Welcome! You have 7 days left in your trial',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 5. Determine access and status
    const now = new Date()
    const trialEndDate = userData.trial_end_date ? new Date(userData.trial_end_date) : null
    const subscriptionEndDate = userData.subscription_end_date
      ? new Date(userData.subscription_end_date)
      : null

    let hasAccess = false
    let daysRemaining: number | null = null
    let message = ''
    let status = userData.subscription_status as SubscriptionStatusResponse['status']

    // 6. Check access based on subscription status
    switch (userData.subscription_status) {
      case 'active':
        hasAccess = true
        if (subscriptionEndDate) {
          daysRemaining = Math.ceil((subscriptionEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          message = 'Your subscription is active'
        }
        break

      case 'trial':
        // Check if trial is still valid
        if (trialEndDate && trialEndDate > now) {
          hasAccess = true
          daysRemaining = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          message = `You have ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left in your trial`
        } else {
          // Trial expired
          hasAccess = false
          status = 'expired'
          message = 'Your trial has expired. Please subscribe to continue.'
        }
        break

      case 'cancelled':
        // Check if cancelled subscription still has time remaining
        if (subscriptionEndDate && subscriptionEndDate > now) {
          hasAccess = true
          daysRemaining = Math.ceil((subscriptionEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
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

    // 7. Return subscription status
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
