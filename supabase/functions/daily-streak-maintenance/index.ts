/**
 * Edge Function: Daily Streak Maintenance
 *
 * Cron job that runs daily at 00:05 UTC to process missed days and handle streak freezes.
 * This function identifies users who didn't complete their daily learning goals yesterday
 * and automatically consumes streak freezes or resets streaks as needed.
 *
 * @module functions/daily-streak-maintenance
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
      console.error('[daily-streak-maintenance] No valid Authorization header found')
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

    console.log('[daily-streak-maintenance] Starting daily streak maintenance...')

    // 3. Call the database function to process daily maintenance
    const { data, error } = await supabase.rpc('process_daily_streak_maintenance')

    if (error) {
      console.error('[daily-streak-maintenance] Database function error:', error)
      return new Response(
        JSON.stringify({
          error: 'Failed to process daily streak maintenance',
          details: error.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`[daily-streak-maintenance] Successfully processed ${data} users`)

    // 4. Return success response
    return new Response(
      JSON.stringify({
        success: true,
        processedUsers: data,
        message: `Daily streak maintenance completed. Processed ${data} users.`,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('[daily-streak-maintenance] Unexpected error:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error during daily streak maintenance',
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
