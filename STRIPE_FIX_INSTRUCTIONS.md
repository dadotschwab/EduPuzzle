# 🔧 Stripe Webhook Fix Instructions

## 🎯 Problem Summary

Your Stripe integration is failing because the webhook URL is configured incorrectly. The webhook URL includes an `?apikey=` parameter, which triggers Supabase's JWT authentication. Since Stripe webhooks don't include authorization headers, they're being rejected with 401 errors **before your function code even runs**.

**Good news:** Your subscriptions ARE being created in Stripe successfully! The issue is only with the webhook communication back to Supabase, so your database doesn't get updated.

---

## 🚀 Quick Fix (5 minutes)

### Step 1: Fix Webhook URL in Stripe Dashboard

1. **Go to Stripe Dashboard**
   - Navigate to: https://dashboard.stripe.com/test/webhooks
   - Or: Dashboard → Developers → Webhooks

2. **Find your webhook endpoint**
   - Look for the endpoint with your Supabase URL
   - Currently shows: `https://gqalsczfephexbserzqp.supabase.co/functions/v1/stripe-webhook?apikey=...`

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

### Step 2: Deploy Updated Edge Function

The webhook code has been improved to remove redundant checks and add better logging.

```bash
# Deploy the updated webhook function
supabase functions deploy stripe-webhook

# Verify deployment
supabase functions list
```

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

### Code Changes Made:

1. **Removed redundant signature check** in `stripe-webhook/index.ts`
   - Eliminated duplicate `stripe-signature` header validation
   - Cleaner, more maintainable code

2. **Added better error logging**
   - More descriptive error messages
   - Logs when signature verification succeeds
   - Logs configuration issues clearly

3. **Updated documentation** in `STRIPE_SETUP.md`
   - Added critical warning about webhook URL format
   - Added troubleshooting for 401 errors
   - Clarified webhook testing procedures

### Root Causes Identified:

1. **Primary Issue:** Webhook URL included `?apikey=` parameter
   - This triggered Supabase's JWT authentication
   - Webhooks don't have authorization headers → 401 error
   - Function code never executed

2. **Testing Issue:** Some tests used invalid signature data
   - This is actually GOOD - shows security is working
   - Use proper testing methods (`stripe trigger` or dashboard)

3. **Code Quality:** Redundant signature validation
   - Minor issue, but cleaned up for better maintainability

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
