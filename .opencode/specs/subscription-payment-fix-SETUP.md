# Subscription Payment Fix - Manual Setup

This document contains manual setup steps required for the subscription payment completion fixes.

## Stripe Dashboard Configuration

### 1. Webhook Endpoint Configuration

1. **Navigate to Stripe Dashboard** → Developers → Webhooks
2. **Add Endpoint**: `https://gqalsczfephexbserzqp.supabase.co/functions/v1/stripe-webhook`
3. **Select Events to Send**:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

4. **Copy Webhook Signing Secret** and add to Supabase Edge Function secrets:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

### 2. Product and Price Configuration

Ensure your subscription product is configured correctly:

1. **Navigate to Stripe Dashboard** → Products
2. **Verify Product Settings**:
   - Product name: "EduPuzzle Premium"
   - Description: "Premium vocabulary learning features"
   - Active: ✅

3. **Verify Price Settings**:
   - Price ID: `price_1Qh...` (matches `VITE_STRIPE_MONTHLY_PRICE_ID`)
   - Amount: €6.99 EUR
   - Currency: EUR
   - Billing: Monthly recurring
   - Trial period: 7 days (configured in checkout, not product)

### 3. Checkout Configuration

1. **Navigate to Stripe Dashboard** → Settings → Checkout
2. **Verify Settings**:
   - Customer email: Required
   - Billing address collection: Auto
   - Shipping address collection: No
   - Payment method types: Card (and others as needed)
   - Success URL: Will be set dynamically by frontend
   - Cancel URL: Will be set dynamically by frontend

## Supabase Environment Variables

### Edge Function Secrets

Set these secrets in your Supabase project:

```bash
# Stripe Configuration
supabase secrets set STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Supabase Configuration (should already be set)
supabase secrets set SUPABASE_URL=https://gqalsczfephexbserzqp.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Frontend Environment Variables

Add these to your `.env` file:

```env
# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
VITE_STRIPE_MONTHLY_PRICE_ID=price_1Qh... # Your actual price ID

# Supabase Configuration (should already be set)
VITE_SUPABASE_URL=https://gqalsczfephexbserzqp.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## Database Setup

### 1. Run Migration

The migration file `20251120_add_webhook_events_deduplication.sql` should be applied automatically, but verify:

```sql
-- Check if table exists
SELECT * FROM information_schema.tables
WHERE table_name = 'stripe_webhook_events';

-- Verify table structure
\d stripe_webhook_events;
```

### 2. Verify RLS Policies

```sql
-- Check RLS policies are enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'stripe_webhook_events';

-- Verify policy exists
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'stripe_webhook_events';
```

### 3. Test Database Access

```sql
-- Test service role access (should work)
SELECT COUNT(*) FROM stripe_webhook_events;

-- Test anon role access (should be blocked)
SET ROLE anon;
SELECT COUNT(*) FROM stripe_webhook_events; -- Should return error
```

## Local Development Setup

### 1. Install Stripe CLI

```bash
# Install Stripe CLI
npm install -g stripe

# Login to Stripe
stripe login

# Verify installation
stripe --version
```

### 2. Local Webhook Testing

```bash
# Start webhook listener
cd /path/to/EduPuzzle
chmod +x scripts/test-stripe-webhooks.sh
./scripts/test-stripe-webhooks.sh listen

# In another terminal, test events
./scripts/test-stripe-webhooks.sh checkout
./scripts/test-stripe-webhooks.sh payment
./scripts/test-stripe-webhooks.sh all
```

### 3. Local Supabase Development

```bash
# Start local Supabase
supabase start

# Apply migrations
supabase db push

# Check functions
supabase functions list
```

## Testing Checklist

### 1. Webhook Event Testing

Use the test script to verify each webhook event:

```bash
# Test individual events
./scripts/test-stripe-webhooks.sh checkout    # checkout.session.completed
./scripts/test-stripe-webhooks.sh payment     # invoice.payment_succeeded
./scripts/test-stripe-webhooks.sh failure     # invoice.payment_failed
./scripts/test-stripe-webhooks.sh subscription # customer.subscription.updated

# Test all events
./scripts/test-stripe-webhooks.sh all
```

### 2. End-to-End Payment Flow

1. **Create Test User** in your application
2. **Navigate to Subscription Settings**
3. **Click "Upgrade Subscription"**
4. **Complete Test Payment** using Stripe test card:
   - Card number: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits
5. **Verify Status Update** in UI (should show "active")
6. **Check Database** for correct subscription status
7. **Verify Webhook Events** were processed correctly

### 3. Trial Expiry Race Condition Test

1. **Create User with Trial** (7 days)
2. **Manually Expire Trial** in database:
   ```sql
   UPDATE users
   SET trial_end_date = NOW() - INTERVAL '1 day'
   WHERE id = 'your-user-id';
   ```
3. **Complete Payment** for that user
4. **Verify Status** becomes 'active' (not 'expired')
5. **Check Logs** for Stripe verification process

## Monitoring Setup

### 1. Webhook Event Monitoring

Create this SQL query in Supabase SQL Editor for monitoring:

```sql
-- Webhook Event Processing Dashboard
SELECT
  event_type,
  COUNT(*) as total_events,
  COUNT(DISTINCT customer_id) as unique_customers,
  MAX(processed_at) as last_processed,
  MIN(processed_at) as first_processed
FROM stripe_webhook_events
WHERE processed_at >= NOW() - INTERVAL '24 hours'
GROUP BY event_type
ORDER BY last_processed DESC;
```

### 2. Subscription Status Consistency

```sql
-- Find users with inconsistent subscription status
SELECT
  u.id,
  u.email,
  u.subscription_status,
  u.stripe_customer_id,
  u.trial_end_date,
  u.subscription_end_date,
  CASE
    WHEN u.stripe_customer_id IS NOT NULL AND u.subscription_status = 'expired'
    THEN 'Potential Issue - Has Stripe Customer but Expired Status'
    WHEN u.stripe_customer_id IS NULL AND u.subscription_status = 'active'
    THEN 'Potential Issue - Active Status but No Stripe Customer'
    ELSE 'Status OK'
  END as consistency_check
FROM users u
WHERE u.subscription_status IN ('trial', 'active', 'expired')
ORDER BY u.created_at DESC;
```

### 3. Error Monitoring

Monitor Supabase Edge Function logs:

```bash
# View recent webhook logs
supabase functions logs stripe-webhook --limit 50

# View subscription check logs
supabase functions logs check-subscription --limit 50
```

## Troubleshooting

### Common Issues

1. **Webhook Not Processing**:
   - Check webhook secret is correctly set
   - Verify webhook endpoint URL in Stripe dashboard
   - Check Edge Function logs for signature verification errors

2. **Status Not Updating**:
   - Verify database migration was applied
   - Check RLS policies allow service role access
   - Look for errors in webhook processing logs

3. **Frontend Cache Issues**:
   - Clear browser cache and localStorage
   - Check React Query devtools for cached data
   - Verify stale time settings in useSubscription hook

4. **Trial Expiry Race Condition**:
   - Check if user has `stripe_customer_id` set
   - Verify Stripe API key is accessible in Edge Function
   - Look for Stripe verification logs in check-subscription function

### Debug Commands

```bash
# Check webhook event processing
./scripts/test-stripe-webhooks.sh monitor

# Test specific user's subscription status
curl -X POST "https://gqalsczfephexbserzqp.supabase.co/functions/v1/check-subscription" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"

# View recent webhook events in database
SELECT * FROM stripe_webhook_events
WHERE processed_at >= NOW() - INTERVAL '1 hour'
ORDER BY processed_at DESC;
```

## Production Deployment

### Pre-Deployment Checklist

- [ ] All tests passing in staging environment
- [ ] Webhook endpoint configured in production Stripe dashboard
- [ ] Environment variables set in production Supabase
- [ ] Database migrations applied to production
- [ ] Monitoring queries created and tested
- [ ] Error alerting configured

### Deployment Steps

1. **Deploy Database Changes**:

   ```bash
   supabase db push --linked
   ```

2. **Deploy Edge Functions**:

   ```bash
   supabase functions deploy stripe-webhook
   supabase functions deploy check-subscription
   ```

3. **Verify Webhook Configuration**:
   - Test webhook endpoint with Stripe CLI
   - Check webhook event processing in production logs

4. **Monitor Initial Traffic**:
   - Watch webhook processing logs
   - Monitor subscription status updates
   - Check for any error patterns

### Post-Deployment Monitoring

- Monitor webhook success rate for first 24 hours
- Check subscription status consistency reports
- Verify user feedback on payment completion
- Monitor error rates and response times

---

## Support

If you encounter issues during setup:

1. Check the Supabase Edge Function logs
2. Verify Stripe webhook configuration
3. Test with the provided test scripts
4. Check the troubleshooting section above
5. Review the implementation specification for detailed requirements

For additional support, refer to the main specification document or contact the development team.
