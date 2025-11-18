# Stripe Integration Setup Guide

This guide covers setting up Stripe payments for EduPuzzle following Week 1 implementation.

## 📋 Overview

**What's Implemented:**
- ✅ Database migration for `stripe_customer_id`
- ✅ TypeScript types updated
- ✅ 4 Edge Functions created:
  - `create-checkout` - Creates Stripe Checkout sessions
  - `stripe-webhook` - Handles Stripe events
  - `check-subscription` - Validates subscription access
  - `create-portal-session` - Customer portal for management

**Subscription Model:**
- €6.99/month (per specification)
- 7-day free trial
- Trial starts on signup, subscription starts after checkout

---

## 🔧 Setup Steps

### 1. Stripe Dashboard Setup

#### A. Create Stripe Account
1. Go to https://stripe.com and sign up
2. Complete your business profile
3. Switch to **Test Mode** (toggle in top right)

#### B. Create Product & Price
1. Dashboard → **Products** → **Add Product**
2. Fill in:
   ```
   Name: EduPuzzle Premium
   Description: Full access to vocabulary learning puzzles
   ```
3. Add pricing:
   ```
   Type: Recurring
   Price: €6.99
   Billing period: Monthly
   ```
4. **Save the Price ID** (looks like `price_xxxxx`)

#### C. Get API Keys
1. Dashboard → **Developers** → **API Keys**
2. Copy both keys:
   - **Publishable key**: `pk_test_xxxxx`
   - **Secret key**: `sk_test_xxxxx`

---

### 2. Environment Variables Setup

#### A. Supabase Environment Variables

Add these in Supabase Dashboard → Edge Functions → Settings:

```bash
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_MONTHLY_PRICE_ID=price_xxxxx
```

**⚠️ DO NOT set STRIPE_WEBHOOK_SECRET yet** - we'll get this after deploying the webhook function.

#### B. Local Environment Variables

Create/update `.env.local`:

```bash
# Existing Supabase variables
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxx

# Add Stripe variables
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
VITE_STRIPE_MONTHLY_PRICE_ID=price_xxxxx
```

---

### 3. Deploy Edge Functions

```bash
# Deploy all Stripe functions
supabase functions deploy create-checkout
supabase functions deploy stripe-webhook
supabase functions deploy check-subscription
supabase functions deploy create-portal-session

# Set environment secrets
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxxxx
supabase secrets set STRIPE_MONTHLY_PRICE_ID=price_xxxxx
```

---

### 4. Configure Stripe Webhook

#### A. Get Webhook URL
After deploying the webhook function, your URL will be:
```
https://[your-project-ref].supabase.co/functions/v1/stripe-webhook
```

#### B. Add Webhook Endpoint in Stripe
1. Dashboard → **Developers** → **Webhooks** → **Add endpoint**
2. Endpoint URL: (paste URL from above)
3. **Select events to listen to:**
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Click **Add endpoint**

#### C. Get Webhook Signing Secret
1. Click on your newly created webhook endpoint
2. Click **Reveal** under "Signing secret"
3. Copy the secret (starts with `whsec_`)
4. Add to Supabase:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

---

### 5. Apply Database Migration

Run the migration to add the `stripe_customer_id` field:

```bash
# Using Supabase CLI
supabase db push

# Or apply manually in Supabase Dashboard → SQL Editor
# Run the contents of: supabase/migrations/20251118_add_stripe_fields.sql
```

Verify the migration:
```sql
-- Run in SQL Editor
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'stripe_customer_id';
```

---

## 🧪 Testing

### Option 1: Stripe CLI (Recommended)

#### Install Stripe CLI
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Linux
curl -s https://packages.stripe.com/api/v1/public-key | sudo apt-key add -
sudo apt-get install stripe

# Windows (with Scoop)
scoop install stripe
```

#### Login to Stripe
```bash
stripe login
```

#### Forward Webhooks to Local Development
```bash
# Forward to deployed Supabase function
stripe listen --forward-to https://[your-project-ref].supabase.co/functions/v1/stripe-webhook

# This will output a webhook signing secret (whsec_xxxxx)
# Add it to your Supabase secrets
```

#### Test Webhook Events
```bash
# Test checkout completion
stripe trigger checkout.session.completed

# Test subscription created
stripe trigger customer.subscription.created

# Test payment succeeded
stripe trigger invoice.payment_succeeded

# Test payment failed
stripe trigger invoice.payment_failed

# Test subscription cancelled
stripe trigger customer.subscription.deleted
```

### Option 2: Manual Testing

#### Test Checkout Flow
```bash
# Call create-checkout function
curl -X POST 'https://[your-project-ref].supabase.co/functions/v1/create-checkout' \
  -H "Authorization: Bearer [user-jwt-token]" \
  -H "Content-Type: application/json" \
  -d '{}'

# Response will include sessionUrl
# Open in browser to complete test checkout
```

#### Use Stripe Test Cards
When testing checkout, use these test card numbers:

```
Success: 4242 4242 4242 4242
Requires Authentication: 4000 0027 6000 3184
Declined: 4000 0000 0000 0002

Expiry: Any future date (e.g., 12/34)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

#### Test Subscription Status
```bash
# Check subscription status
curl 'https://[your-project-ref].supabase.co/functions/v1/check-subscription' \
  -H "Authorization: Bearer [user-jwt-token]"
```

#### Test Customer Portal
```bash
# Create portal session
curl -X POST 'https://[your-project-ref].supabase.co/functions/v1/create-portal-session' \
  -H "Authorization: Bearer [user-jwt-token]" \
  -H "Content-Type: application/json" \
  -d '{"returnUrl": "http://localhost:5173/settings/subscription"}'
```

---

## 🔍 Debugging

### Check Edge Function Logs
```bash
# View logs for specific function
supabase functions logs create-checkout
supabase functions logs stripe-webhook
supabase functions logs check-subscription
```

### Common Issues

#### 1. "STRIPE_SECRET_KEY not configured"
- Ensure secrets are set: `supabase secrets list`
- Re-deploy function after setting secrets

#### 2. "Invalid signature" on webhook
- Verify `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
- Ensure webhook is sending to correct URL
- Check that raw body is being used (not parsed JSON)

#### 3. "No active subscription found" in portal
- User must complete checkout first
- Check `stripe_customer_id` exists in users table:
  ```sql
  SELECT id, email, stripe_customer_id, subscription_status
  FROM users WHERE email = 'test@example.com';
  ```

#### 4. Trial not working
- Verify `trial_end_date` is set correctly in database
- Check subscription_data.trial_period_days in create-checkout function

---

## 📊 Database Queries for Testing

```sql
-- Check user subscription status
SELECT
  id,
  email,
  subscription_status,
  trial_end_date,
  subscription_end_date,
  stripe_customer_id
FROM users
WHERE email = 'your-test-email@example.com';

-- Update subscription status manually (testing only)
UPDATE users
SET
  subscription_status = 'active',
  subscription_end_date = NOW() + INTERVAL '30 days',
  stripe_customer_id = 'cus_test123'
WHERE email = 'your-test-email@example.com';

-- Reset to trial
UPDATE users
SET
  subscription_status = 'trial',
  trial_end_date = NOW() + INTERVAL '7 days',
  subscription_end_date = NULL
WHERE email = 'your-test-email@example.com';

-- Check all active subscriptions
SELECT
  COUNT(*) as active_subscriptions
FROM users
WHERE subscription_status = 'active';
```

---

## 🔒 Security Checklist

Before going to production:

- [ ] Switch to **live** Stripe API keys (remove `_test_`)
- [ ] Update webhook URL to production domain
- [ ] Verify webhook signature is being checked
- [ ] Enable RLS policies on users table
- [ ] Test with real payment method (then refund)
- [ ] Set up Stripe email notifications
- [ ] Configure Stripe tax collection (if applicable)
- [ ] Review Stripe security best practices

---

## 📈 Monitoring

### Stripe Dashboard
- Monitor successful/failed payments
- View customer subscriptions
- Check webhook delivery status
- Review dispute/chargeback alerts

### Supabase Logs
- Monitor Edge Function errors
- Check authentication failures
- Review database query performance

---

## 🚀 Next Steps (Week 2)

After completing Week 1 setup and testing:

1. Create frontend API client (`src/lib/api/stripe.ts`)
2. Create `useSubscription` React hook
3. Update `SubscriptionSettings.tsx` component
4. Add success/cancel pages
5. Create `SubscriptionGate` component

See the main implementation plan in the previous conversation for details.

---

## 📞 Support

- **Stripe Documentation**: https://stripe.com/docs
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions
- **Stripe CLI Reference**: https://stripe.com/docs/stripe-cli

---

**Status**: Week 1 Backend Complete ✅
**Next**: Week 2 Frontend Integration
