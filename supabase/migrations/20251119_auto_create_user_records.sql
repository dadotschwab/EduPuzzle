-- Backfill user records for existing auth users
-- This migration adds subscription fields to users who signed up before Stripe integration
-- Note: The trigger function is updated in 20250113_auth_sync.sql to include subscription fields
-- Migration: 20251119_auto_create_user_records

-- ============================================================================
-- Backfill existing auth users that don't have user records
-- ============================================================================

-- Part 1: Create records for auth users that don't have any user record
-- This handles users who signed up before the trigger was created
INSERT INTO public.users (
  id, 
  email, 
  subscription_status, 
  trial_end_date,
  created_at,
  updated_at
)
SELECT 
  au.id,
  au.email,
  'trial' as subscription_status,
  au.created_at + INTERVAL '7 days' as trial_end_date,
  au.created_at,
  NOW() as updated_at
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL  -- Only users that don't already have a record
ON CONFLICT (id) DO NOTHING;

-- Part 2: Update existing user records that are missing subscription fields
-- This handles users who were created before Stripe integration
UPDATE public.users
SET 
  subscription_status = 'trial',
  trial_end_date = created_at + INTERVAL '7 days',
  updated_at = NOW()
WHERE subscription_status IS NULL
  OR trial_end_date IS NULL;

-- ============================================================================
-- Part 4: Verification queries (commented out, for manual verification)
-- ============================================================================

-- To verify the trigger was created successfully, run:
-- SELECT trigger_name, event_manipulation, event_object_table, action_statement
-- FROM information_schema.triggers
-- WHERE trigger_name = 'on_auth_user_created';

-- To verify all auth users now have user records, run:
-- SELECT 
--   (SELECT COUNT(*) FROM auth.users) as auth_users_count,
--   (SELECT COUNT(*) FROM public.users) as app_users_count,
--   (SELECT COUNT(*) FROM auth.users) - (SELECT COUNT(*) FROM public.users) as missing_records
-- ;
-- Expected: missing_records = 0

-- To see users with their subscription status, run:
-- SELECT 
--   u.id,
--   u.email,
--   u.subscription_status,
--   u.trial_end_date,
--   u.created_at,
--   CASE 
--     WHEN u.trial_end_date > NOW() THEN 'Active Trial'
--     WHEN u.trial_end_date <= NOW() THEN 'Expired Trial'
--     ELSE 'No Trial'
--   END as trial_status
-- FROM public.users u
-- ORDER BY u.created_at DESC
-- LIMIT 10;
