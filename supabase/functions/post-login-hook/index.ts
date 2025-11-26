import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    })
  }
  try {
    // 1. SECURITY CHECK
    const secret = Deno.env.get('AUTH_HOOK_SECRET')
    const signature =
      req.headers.get('webhook-signature') || req.headers.get('x-supabase-signature')
    if (secret) {
      if (!signature) {
        console.error('Access denied: Missing signature header (webhook-signature).')
        return new Response(
          JSON.stringify({
            error: 'Unauthorized',
          }),
          {
            status: 401,
          }
        )
      }
    }

    // 2. PARSE REQUEST
    const rawBody = await req.text()
    const body = JSON.parse(rawBody)
    const incomingClaims = body.claims || {}
    const appMetadata = incomingClaims.app_metadata || {}
    const userMetadata = incomingClaims.user_metadata || {}
    const subscriptionData = appMetadata.subscription || {}

    console.log(`Processing login for User ${body.user_id}`)

    // 3. SYNC NAME FROM DATABASE TO JWT (for existing users who don't have name in JWT)
    let userName = userMetadata.name
    if (!userName) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        if (supabaseUrl && supabaseServiceKey) {
          const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
          })

          // Fetch name from database
          const { data: userData } = await serviceClient
            .from('users')
            .select('name')
            .eq('id', body.user_id)
            .single()

          if (userData?.name) {
            userName = userData.name
            console.log(`Synced name "${userName}" from database to JWT for user ${body.user_id}`)
          }
        }
      } catch (nameError) {
        console.error('Error syncing name from database:', nameError)
        // Continue without name - not critical
      }
    }

    // 4. BUILD CUSTOM CLAIMS
    const myNewClaims = {
      subscription_status: subscriptionData.status || 'none',
      has_access: subscriptionData.has_access || false,
      is_trial: subscriptionData.is_trial || false,
    }

    const finalClaims = {
      ...incomingClaims,
      ...myNewClaims,
      // Include name in user_metadata if available
      user_metadata: {
        ...userMetadata,
        ...(userName ? { name: userName } : {}),
      },
    }

    return new Response(
      JSON.stringify({
        claims: finalClaims,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    // Fail-Safe: Allow login
    return new Response(JSON.stringify({}), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status: 200,
    })
  }
})
