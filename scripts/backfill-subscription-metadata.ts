#!/usr/bin/env npx tsx

/**
 * Backfill Script: Update Subscription Metadata for Existing Users
 *
 * Updates all existing users with subscription metadata in JWT tokens.
 * This ensures existing users have proper JWT metadata after migration.
 *
 * Run this script once after deploying the new authentication system.
 *
 * Usage: npx tsx scripts/backfill-subscription-metadata.ts
 */

import { createClient } from '@supabase/supabase-js@2.39.3'

// Configuration
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:')
  console.error('SUPABASE_URL:', !!supabaseUrl)
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

// Create Supabase client with service role for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

/**
 * Subscription metadata structure
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
 * Calculate subscription metadata from database values
 */
function calculateSubscriptionMetadata(userData: {
  subscription_status: string | null
  trial_end_date: string | null
  subscription_end_date: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
}): SubscriptionMetadata {
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

  return {
    status,
    has_access: hasAccess,
    is_trial: isTrial,
    expires_at: userData.subscription_end_date,
    trial_ends_at: userData.trial_end_date,
    checked_at: now.toISOString(),
  }
}

/**
 * Main backfill function
 */
async function backfillAllUsers() {
  console.log('🚀 Starting subscription metadata backfill...')

  try {
    // Get all users with subscription data
    const { data: users, error: fetchError } = await supabase.from('users').select(`
        id,
        email,
        subscription_status,
        trial_end_date,
        subscription_end_date,
        stripe_customer_id,
        stripe_subscription_id
      `)

    if (fetchError) {
      console.error('❌ Failed to fetch users:', fetchError)
      throw fetchError
    }

    if (!users || users.length === 0) {
      console.log('✅ No users found to backfill')
      return
    }

    console.log(`📊 Found ${users.length} users to backfill`)

    let successCount = 0
    let errorCount = 0

    // Process each user
    for (const user of users) {
      try {
        console.log(`🔄 Processing user: ${user.email} (${user.id})`)

        // Calculate subscription metadata
        const subscriptionMetadata = calculateSubscriptionMetadata(user)

        // Update user metadata in auth system
        const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
          app_metadata: {
            subscription: subscriptionMetadata,
            stripe_customer_id: user.stripe_customer_id,
            stripe_subscription_id: user.stripe_subscription_id,
          },
        })

        if (updateError) {
          console.error(`❌ Failed to update user ${user.id}:`, updateError)
          errorCount++
        } else {
          console.log(`✅ Updated user ${user.id} with subscription metadata:`, {
            status: subscriptionMetadata.status,
            hasAccess: subscriptionMetadata.has_access,
            isTrial: subscriptionMetadata.is_trial,
          })
          successCount++
        }
      } catch (error) {
        console.error(`❌ Error processing user ${user.id}:`, error)
        errorCount++
      }
    }

    console.log('\n📈 Backfill Summary:')
    console.log(`✅ Successfully updated: ${successCount} users`)
    console.log(`❌ Failed to update: ${errorCount} users`)
    console.log(`📊 Total processed: ${users.length} users`)

    if (errorCount === 0) {
      console.log('\n🎉 Backfill completed successfully!')
    } else {
      console.log(`\n⚠️  Backfill completed with ${errorCount} errors. Check logs above.`)
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Backfill failed with error:', error)
    process.exit(1)
  }
}

// Run the backfill
if (import.meta.url === `file://${process.argv[1]}`) {
  backfillAllUsers()
} else {
  console.log('This script should be run with: npx tsx scripts/backfill-subscription-metadata.ts')
}
