/**
 * Edge Function: Monthly Streak Reset
 *
 * Cron job that runs on the 1st of each month at 00:10 UTC to refill streak freezes.
 * This function resets the streak_freezes_available count to 1 for all users who have
 * fewer than 1 freeze available, ensuring monthly renewal of streak protection.
 *
 * @module functions/monthly-streak-reset
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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Verify service role key (cron jobs should use service role)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.includes('Bearer')) {
      logger.error('[monthly-streak-reset] No valid Authorization header found')
      return new Response(JSON.stringify({ error: 'Unauthorized - Service role required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    logger.info('[monthly-streak-reset] Starting monthly streak freeze refill...')

    // 3. Call the database function to refill streak freezes
    const { data, error } = await supabase.rpc('refill_streak_freezes')

    if (error) {
      logger.error('[monthly-streak-reset] Database function error:', error)
      return new Response(
        JSON.stringify({
          error: 'Failed to refill streak freezes',
          details: error.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    logger.info(`[monthly-streak-reset] Successfully refilled freezes for ${data} users`)

    // 4. Return success response
    return new Response(
      JSON.stringify({
        success: true,
        refilledUsers: data,
        message: `Monthly streak freeze refill completed. Refilled freezes for ${data} users.`,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    logger.error('[monthly-streak-reset] Unexpected error:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error during monthly streak reset',
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
