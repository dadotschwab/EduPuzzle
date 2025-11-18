-- Add Stripe integration fields to users table
-- Migration: 20251118_add_stripe_fields

-- Add stripe_customer_id column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

-- Create index for faster lookups by Stripe customer ID
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer
ON users(stripe_customer_id)
WHERE stripe_customer_id IS NOT NULL;

-- Add comment to document the field
COMMENT ON COLUMN users.stripe_customer_id IS 'Stripe customer ID for payment processing (cus_xxxxx format)';

-- Note: subscription_status, trial_end_date, and subscription_end_date already exist
-- in the initial schema (20250113_initial_schema.sql)
