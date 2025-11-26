/**
 * Edge Function: Update User Subscription Metadata
 *
 * Updates user's JWT metadata with current subscription status from database.
 * This enables instant subscription checks without database queries.
 *
 * Uses service role key for admin operations to update user metadata.
 *
 * @module functions/update-user-subscription
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { logger } from '../_shared/logger.ts'

/**
 * CORS headers for Edge Function
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Subscription metadata structure stored in JWT
 */
interface SubscriptionMetadata {
  status: 'active' | 'trial' | 'trialing' | 'expired' | 'canceled' | 'none'
  has_access: boolean
  is_trial: boolean
  expires_at: string | null
  trial_ends_at: string | null
  checked_at: string
}

/**
 * Request body for updating user subscription
 */
interface UpdateSubscriptionRequest {
  userId: string
}

/**
 * Response from the Edge Function
 */
interface UpdateSubscriptionResponse {
  success: boolean
  user?: {
    id: string
    app_metadata: {
      subscription: SubscriptionMetadata
      stripe_customer_id?: string
      stripe_subscription_id?: string
    }
  }
  error?: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Validate request method
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Parse request body
    const body: UpdateSubscriptionRequest = await req.json()
    const { userId } = body

    if (!userId || typeof userId !== 'string') {
      return new Response(JSON.stringify({ error: 'Valid userId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      logger.error('[update-user-subscription] Missing Supabase environment variables')
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 4. Create service client for admin operations
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    logger.info(`[update-user-subscription] Processing user: ${userId}`)

    // 5. Fetch user subscription data from database
    const { data: userData, error: userError } = await serviceClient
      .from('users')
      .select(
        `
        subscription_status,
        trial_end_date,
        subscription_end_date,
        stripe_customer_id,
        stripe_subscription_id
      `
      )
      .eq('id', userId)
      .single()

    if (userError) {
      logger.error('[update-user-subscription] Database query error:', userError)

      // If user doesn't exist, create them with trial access
      if (userError.code === 'PGRST116') {
        logger.info(`[update-user-subscription] User not found, creating: ${userId}`)

        // Get user from auth to get email
        const { data: authUser } = await serviceClient.auth.admin.getUserById(userId)

        if (!authUser.user) {
          return new Response(JSON.stringify({ error: 'User not found in auth system' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        // Create user record with 7-day trial
        const trialEndDate = new Date()
        trialEndDate.setDate(trialEndDate.getDate() + 7)

        const { data: newUser, error: createError } = await serviceClient
          .from('users')
          .insert({
            id: userId,
            email: authUser.user.email!,
            subscription_status: 'trial',
            trial_end_date: trialEndDate.toISOString(),
          })
          .select(
            'subscription_status, trial_end_date, subscription_end_date, stripe_customer_id, stripe_subscription_id'
          )
          .single()

        if (createError || !newUser) {
          logger.error('[update-user-subscription] Failed to create user:', createError)
          return new Response(JSON.stringify({ error: 'Failed to create user record' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        // Use the newly created user data
        userData = newUser
      } else {
        return new Response(JSON.stringify({ error: 'Database query failed' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // 6. Calculate subscription metadata
    const now = new Date()
    const trialEndDate = userData.trial_end_date ? new Date(userData.trial_end_date) : null
    const subscriptionEndDate = userData.subscription_end_date
      ? new Date(userData.subscription_end_date)
      : null

    let status: SubscriptionMetadata['status'] = 'none'
    let hasAccess = false
    let isTrial = false

    // Determine status and access based on database values
    switch (userData.subscription_status) {
      case 'active':
        status = 'active'
        hasAccess = true
        isTrial = false
        break

      case 'trial':
        status = 'trial'
        isTrial = true
        // Check if trial is still valid
        if (trialEndDate && trialEndDate > now) {
          hasAccess = true
          status = 'trial'
        } else {
          hasAccess = false
          status = 'expired'
        }
        break

      case 'cancelled':
        status = 'canceled'
        // Check if cancelled subscription still has time remaining
        if (subscriptionEndDate && subscriptionEndDate > now) {
          hasAccess = true
        } else {
          hasAccess = false
        }
        break

      case 'past_due':
        status = 'past_due'
        // Grace period - still give access
        hasAccess = true
        isTrial = false
        break

      case 'expired':
      default:
        status = 'expired'
        hasAccess = false
        isTrial = false
        break
    }

    // 7. Create subscription metadata object
    const subscriptionMetadata: SubscriptionMetadata = {
      status,
      has_access: hasAccess,
      is_trial: isTrial,
      expires_at: userData.subscription_end_date,
      trial_ends_at: userData.trial_end_date,
      checked_at: now.toISOString(),
    }

    // 8. Update user metadata in auth system
    const { data: updatedUser, error: updateError } = await serviceClient.auth.admin.updateUserById(
      userId,
      {
        app_metadata: {
          subscription: subscriptionMetadata,
          stripe_customer_id: userData.stripe_customer_id,
          stripe_subscription_id: userData.stripe_subscription_id,
        },
      }
    )

    if (updateError) {
      logger.error('[update-user-subscription] Failed to update user metadata:', updateError)
      return new Response(JSON.stringify({ error: 'Failed to update user metadata' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    logger.info(`[update-user-subscription] Successfully updated user: ${userId}`, {
      status,
      hasAccess,
      isTrial,
    })

    // 9. Return success response
    const response: UpdateSubscriptionResponse = {
      success: true,
      user: {
        id: updatedUser.user.id,
        app_metadata: updatedUser.user.app_metadata as {
          subscription: SubscriptionMetadata
          stripe_customer_id?: string
          stripe_subscription_id?: string
        },
      },
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    logger.error('[update-user-subscription] Unexpected error:', error)

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
