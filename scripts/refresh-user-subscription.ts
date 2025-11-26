/**
 * Script to manually refresh a user's subscription metadata
 *
 * Usage: npx tsx --env-file=.env.local scripts/refresh-user-subscription.ts <user_id>
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function refreshUserSubscription(userId: string) {
  console.log(`\n🔄 Refreshing subscription for user: ${userId}`)

  // Check current user state in database
  console.log('\n📊 Current database state:')
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (userError) {
    console.error('❌ Failed to fetch user:', userError.message)
    process.exit(1)
  }

  console.log('  Email:', userData.email)
  console.log('  Subscription Status:', userData.subscription_status || 'none')
  console.log('  Trial End Date:', userData.trial_end_date || 'none')
  console.log('  Subscription End Date:', userData.subscription_end_date || 'none')
  console.log('  Stripe Customer ID:', userData.stripe_customer_id || 'none')
  console.log('  Stripe Subscription ID:', userData.stripe_subscription_id || 'none')

  // Call the update-user-subscription Edge Function
  console.log('\n🔄 Calling update-user-subscription Edge Function...')
  const { data, error } = await supabase.functions.invoke('update-user-subscription', {
    body: { userId },
  })

  if (error) {
    console.error('❌ Failed to update subscription:', error)
    process.exit(1)
  }

  console.log('\n✅ Successfully refreshed subscription metadata:')
  console.log('  Status:', data.user?.app_metadata?.subscription?.status || 'unknown')
  console.log('  Has Access:', data.user?.app_metadata?.subscription?.has_access || false)
  console.log('  Is Trial:', data.user?.app_metadata?.subscription?.is_trial || false)
  console.log('  Expires At:', data.user?.app_metadata?.subscription?.expires_at || 'none')
  console.log('  Trial Ends At:', data.user?.app_metadata?.subscription?.trial_ends_at || 'none')

  console.log('\n✨ Done! The user needs to log out and log back in to get the updated JWT.\n')
}

// Get user ID from command line
const userId = process.argv[2]

if (!userId) {
  console.error('❌ Usage: npx tsx scripts/refresh-user-subscription.ts <user_id>')
  process.exit(1)
}

refreshUserSubscription(userId).catch((error) => {
  console.error('❌ Script error:', error)
  process.exit(1)
})
