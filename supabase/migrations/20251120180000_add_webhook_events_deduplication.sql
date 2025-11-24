-- Migration: Add webhook event deduplication table
-- Created: 2025-11-20
-- Purpose: Prevent duplicate processing of Stripe webhook events

-- Create webhook events table for deduplication
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  customer_id TEXT,
  subscription_id TEXT,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_event_id ON stripe_webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_customer_id ON stripe_webhook_events(customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_subscription_id ON stripe_webhook_events(subscription_id);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_user_id ON stripe_webhook_events(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_event_type ON stripe_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_processed_at ON stripe_webhook_events(processed_at);

-- Add RLS policies
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- Only service role can insert/read webhook events (for security)
CREATE POLICY "Service role can manage webhook events" ON stripe_webhook_events
  FOR ALL USING (auth.role() = 'service_role');

-- Add comments
COMMENT ON TABLE stripe_webhook_events IS 'Tracks processed Stripe webhook events to prevent duplicate processing';
COMMENT ON COLUMN stripe_webhook_events.event_id IS 'Unique Stripe event ID (e.g., evt_xxx)';
COMMENT ON COLUMN stripe_webhook_events.event_type IS 'Stripe event type (e.g., checkout.session.completed)';
COMMENT ON COLUMN stripe_webhook_events.customer_id IS 'Stripe customer ID (cus_xxx)';
COMMENT ON COLUMN stripe_webhook_events.subscription_id IS 'Stripe subscription ID (sub_xxx)';
COMMENT ON COLUMN stripe_webhook_events.user_id IS 'Reference to users table for faster lookups';