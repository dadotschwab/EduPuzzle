# 🔧 Stripe Webhook Fix Instructions - UPDATED

## 🎯 Problem Summary

Your Stripe integration was failing due to **TWO configuration issues**:

1. **Incorrect configuration location**: Using `.supabase.yaml` in function directory instead of `config.toml` in project root
2. **Webhook URL format**: The webhook URL may include an `?apikey=` parameter, which triggers Supabase's JWT authentication

Since Stripe webhooks don't include authorization headers, they were being rejected with 401 errors **before your function code even runs**.

**Good news:** Your subscriptions ARE being created in Stripe successfully! The issue is only with the webhook communication back to Supabase, so your database doesn't get updated.

---

## ✅ Configuration Fixed (Completed)

The following changes have been implemented:

1. ✅ **Added proper configuration to `supabase/config.toml`**
   - Added `[functions.stripe-webhook]` section with `verify_jwt = false`
   - This is the correct location per Supabase official documentation

2. ✅ **Removed incorrect `.supabase.yaml` file**
   - Deleted `supabase/functions/stripe-webhook/.supabase.yaml`
   - This file was using an outdated configuration approach

---

## 🚀 Deployment Steps (Required)

### Step 1: Deploy Updated Configuration

**IMPORTANT:** The configuration changes have been made locally. You must deploy them to take effect.

```bash
# Navigate to project directory
cd /home/linux/EduPuzzle/EduPuzzle

# Deploy the stripe-webhook function with updated configuration
supabase functions deploy stripe-webhook

# Verify deployment
supabase functions list
```

**What this does:**
- Deploys the function with the new `verify_jwt = false` configuration from `config.toml`
- Allows Stripe webhooks to bypass JWT authentication at the gateway level
- Security is maintained through Stripe signature verification in the function code

### Step 2: Fix Webhook URL in Stripe Dashboard

1. **Go to Stripe Dashboard**
   - Navigate to: https://dashboard.stripe.com/test/webhooks
   - Or: Dashboard → Developers → Webhooks

2. **Find your webhook endpoint**
   - Look for the endpoint with your Supabase URL
   - Currently may show: `https://gqalsczfephexbserzqp.supabase.co/functions/v1/stripe-webhook?apikey=...`

3. **Edit the endpoint**
   - Click on the webhook endpoint
   - Click "Update details" or the edit button
   - **Remove everything after `/stripe-webhook`** including `?apikey=...`

   **Change from:**
   ```
   https://gqalsczfephexbserzqp.supabase.co/functions/v1/stripe-webhook?apikey=YOUR_KEY
   ```

   **To:**
   ```
   https://gqalsczfephexbserzqp.supabase.co/functions/v1/stripe-webhook
   ```

4. **Save the changes**

### Step 3: Verify Webhook Secret is Set

```bash
# Check if webhook secret is configured
supabase secrets list

# If STRIPE_WEBHOOK_SECRET is not set, add it:
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
```

To get your webhook secret:
1. Go to Stripe Dashboard → Developers → Webhooks
2. Click on your webhook endpoint
3. Click "Reveal" under "Signing secret"
4. Copy the secret (starts with `whsec_`)

### Step 4: Test the Webhook

#### Option A: Use Stripe CLI (Recommended)

```bash
# Test checkout completion
stripe trigger checkout.session.completed

# Test subscription creation
stripe trigger customer.subscription.created

# Test payment success
stripe trigger invoice.payment_succeeded
```

#### Option B: Use Stripe Dashboard

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click on your webhook endpoint
3. Click "Send test webhook"
4. Select an event type (e.g., `checkout.session.completed`)
5. Click "Send test webhook"
6. Check the response - should now return **200 OK** instead of 401

### Step 5: Verify in Supabase Logs

```bash
# Watch webhook logs in real-time
supabase functions logs stripe-webhook --follow

# Or check recent logs
supabase functions logs stripe-webhook
```

**What to look for:**
- ✅ "Webhook signature verified successfully"
- ✅ "Processing webhook event: checkout.session.completed"
- ✅ "User [id] subscription activated"
- ❌ NOT seeing "Missing authorization header"

---

## 🔍 Verification Checklist

After making the changes, verify everything works:

- [ ] Webhook URL in Stripe has NO query parameters
- [ ] Edge function deployed successfully
- [ ] STRIPE_WEBHOOK_SECRET is configured in Supabase
- [ ] Test webhook returns 200 OK (not 401)
- [ ] Supabase logs show "Webhook signature verified successfully"
- [ ] Database is updated when test webhooks are sent

---

## 📊 Check Database Updates

After sending a test webhook, verify your database is being updated:

```sql
-- Check recent user subscription updates
SELECT
  id,
  email,
  subscription_status,
  stripe_customer_id,
  subscription_end_date,
  updated_at
FROM users
WHERE stripe_customer_id IS NOT NULL
ORDER BY updated_at DESC
LIMIT 5;
```

---

## 🎯 What Was Fixed

### Configuration Changes Made:

1. **✅ Added proper function configuration to `supabase/config.toml`**
   - Added `[functions.stripe-webhook]` section
   - Set `verify_jwt = false` to disable JWT authentication for this endpoint
   - This is the **correct location** per Supabase official documentation
   - Allows Stripe webhooks to reach the function without authorization headers

2. **✅ Removed incorrect `.supabase.yaml` file**
   - Deleted `supabase/functions/stripe-webhook/.supabase.yaml`
   - This file was using an outdated/incorrect configuration approach
   - Per-function `.supabase.yaml` files are not the recommended method

3. **✅ Updated documentation**
   - Clarified the correct configuration approach
   - Added deployment instructions
   - Updated troubleshooting steps

### Root Causes Identified:

1. **Primary Issue:** Incorrect configuration location
   - Using `.supabase.yaml` in function directory (not supported/outdated)
   - Should use `config.toml` in project root with `[functions.stripe-webhook]` section
   - This prevented JWT bypass from taking effect

2. **Secondary Issue:** Webhook URL may include `?apikey=` parameter
   - This triggers Supabase's JWT authentication middleware
   - Webhooks don't have authorization headers → 401 error
   - Function code never executed

3. **Security Note:** Signature verification is still enforced
   - The function code verifies Stripe webhook signatures
   - Only legitimate Stripe webhooks can trigger database updates
   - Security is maintained through cryptographic verification

---

## 🧪 Testing Your Fix

### End-to-End Test

1. **Create a test checkout session** (from your app or via curl):
   ```bash
   curl -X POST 'https://gqalsczfephexbserzqp.supabase.co/functions/v1/create-checkout' \
     -H "Authorization: Bearer [YOUR_USER_JWT]" \
     -H "Content-Type: application/json" \
     -d '{}'
   ```

2. **Complete the checkout** using Stripe test card:
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits

3. **Verify webhook was received**:
   ```bash
   supabase functions logs stripe-webhook | grep "checkout.session.completed"
   ```

4. **Check database was updated**:
   ```sql
   SELECT subscription_status, stripe_customer_id, subscription_end_date
   FROM users WHERE email = 'your-test-email@example.com';
   ```

### Expected Results:

- ✅ Webhook logs show successful signature verification
- ✅ Database shows `subscription_status = 'active'` or `'trial'`
- ✅ `stripe_customer_id` is populated
- ✅ `subscription_end_date` is set to ~30 days from now
- ✅ Stripe Dashboard shows webhook delivered successfully (200 status)

---

## 🆘 Still Having Issues?

### If you still see 401 errors:

1. **Double-check webhook URL** - NO query parameters!
2. **Clear Stripe CLI cache** - Run `stripe login` again
3. **Verify deployed function** - Run `supabase functions list`
4. **Check environment variables** - Run `supabase secrets list`

### If signature verification fails:

1. **Verify webhook secret** - Must match between Stripe and Supabase
2. **Check clock sync** - Stripe rejects requests with wrong timestamp
3. **Use raw body** - Don't parse JSON before verification (already handled correctly)

### If database isn't updating:

1. **Check RLS policies** - Edge function uses service role key
2. **Verify user exists** - Check `metadata.supabase_user_id` in Stripe
3. **Check logs for errors** - `supabase functions logs stripe-webhook`

---

## 📈 Monitoring Going Forward

### Stripe Dashboard

Monitor at: https://dashboard.stripe.com/test/webhooks

Watch for:
- Webhook delivery success rate
- Response times
- Failed attempts (should retry automatically)

### Supabase Logs

```bash
# Real-time monitoring
supabase functions logs stripe-webhook --follow

# Check for errors
supabase functions logs stripe-webhook | grep -i error
```

---

## ✅ Summary

**What you need to do:**
1. Update webhook URL in Stripe (remove `?apikey=`)
2. Deploy updated edge function
3. Test with Stripe CLI or Dashboard
4. Verify logs show successful webhook processing

**Estimated time:** 5-10 minutes

**Difficulty:** Easy - just URL configuration change

---

**You're almost there! Just update that webhook URL and you'll be good to go! 🚀**
