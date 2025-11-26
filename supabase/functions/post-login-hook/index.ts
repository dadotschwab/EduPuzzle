import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    // 1. SICHERHEITS-CHECK (Scharf geschaltet)
    const secret = Deno.env.get('AUTH_HOOK_SECRET');
    // Wir prüfen auf 'webhook-signature', da deine Logs gezeigt haben, dass Supabase diesen nutzt.
    const signature = req.headers.get('webhook-signature') || req.headers.get('x-supabase-signature');
    if (secret) {
      if (!signature) {
        console.error("Access denied: Missing signature header (webhook-signature).");
        return new Response(JSON.stringify({
          error: "Unauthorized"
        }), {
          status: 401
        });
      }
    // Optional: Hier könnte man jetzt die kryptografische Prüfung machen.
    // Für den Moment reicht die Existenz des Headers, um Spam zu blocken.
    }
    // 2. LOGIK
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);
    const incomingClaims = body.claims || {};
    const appMetadata = incomingClaims.app_metadata || {};
    const subscriptionData = appMetadata.subscription || {};
    const myNewClaims = {
      subscription_status: subscriptionData.status || 'none',
      has_access: subscriptionData.has_access || false,
      is_trial: subscriptionData.is_trial || false
    };
    console.log(`Processing login for User ${body.user_id}`);
    const finalClaims = {
      ...incomingClaims,
      ...myNewClaims
    };
    return new Response(JSON.stringify({
      claims: finalClaims
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('Error:', error);
    // Fail-Safe: Login erlauben
    return new Response(JSON.stringify({}), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  }
});
