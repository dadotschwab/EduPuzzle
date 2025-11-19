# 🚀 Stripe Webhook Deployment Guide

## ✅ Changes Completed

The following configuration changes have been implemented in your local repository:

1. **✅ Added function configuration to `supabase/config.toml`**
   ```toml
   [functions.stripe-webhook]
   verify_jwt = false
   ```

2. **✅ Removed incorrect `.supabase.yaml` file**
   - Deleted: `supabase/functions/stripe-webhook/.supabase.yaml`

---

## 🚀 Deployment Steps (REQUIRED)

### Step 1: Deploy the Function

The configuration changes are local only. You **must deploy** to apply them:

```bash
# Navigate to project directory
cd /home/linux/EduPuzzle/EduPuzzle

# Deploy the stripe-webhook function
supabase functions deploy stripe-webhook

# Expected output:
# Deploying Function stripe-webhook...
# Deployed Function stripe-webhook with version: xxx
```

**What this does:**
- Uploads your function code to Supabase
- Applies the `verify_jwt = false` configuration from `config.toml`
- Configures the API gateway to allow requests without JWT tokens
- Maintains security through Stripe signature verification

### Step 2: Verify Deployment

```bash
# List all deployed functions
supabase functions list

# Check function logs
supabase functions logs stripe-webhook --limit 10
```

### Step 3: Fix Webhook URL in Stripe Dashboard

**CRITICAL:** Your webhook URL must NOT include query parameters.

1. **Go to Stripe Dashboard**
   - URL: https://dashboard.stripe.com/test/webhooks
   - Or navigate: Dashboard → Developers → Webhooks

2. **Locate your webhook endpoint**
   - Find the endpoint pointing to: `gqalsczfephexbserzqp.supabase.co`

3. **Check the URL format**
   - ❌ **WRONG:** `https://gqalsczfephexbserzqp.supabase.co/functions/v1/stripe-webhook?apikey=...`
   - ✅ **CORRECT:** `https://gqalsczfephexbserzqp.supabase.co/functions/v1/stripe-webhook`

4. **Update if necessary**
   - Click on the webhook endpoint
   - Click "Update details" or edit button
   - Remove `?apikey=...` and any other query parameters
   - Save changes

**Why this matters:**
- Query parameters like `?apikey=` trigger JWT authentication middleware
- Even with `verify_jwt = false`, the gateway may still check for auth if apikey is present
- Clean URLs ensure the configuration is properly applied

### Step 4: Verify Environment Variables

Ensure your Supabase project has the required secrets:

```bash
# List all secrets
supabase secrets list

# Should show:
# - STRIPE_SECRET_KEY
# - STRIPE_WEBHOOK_SECRET
# - SUPABASE_URL (auto-set)
# - SUPABASE_SERVICE_ROLE_KEY (auto-set)
```

**If missing, set them:**

```bash
# Set Stripe secret key
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxxxx

# Set webhook signing secret (get from Stripe Dashboard)
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

**To get your webhook signing secret:**
1. Go to Stripe Dashboard → Developers → Webhooks
2. Click on your webhook endpoint
3. Click "Reveal" under "Signing secret"
4. Copy the secret (starts with `whsec_`)

---

## 🧪 Testing

### Test 1: Send Test Webhook from Stripe Dashboard

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click on your webhook endpoint
3. Click "Send test webhook"
4. Select event: `checkout.session.completed`
5. Click "Send test webhook"

**Expected result:**
- ✅ Status: 200 OK
- ✅ Response: `{"ok": true}`
- ❌ NOT: 401 "Missing authorization header"

### Test 2: Use Stripe CLI (Recommended)

```bash
# Install Stripe CLI if not already installed
# macOS: brew install stripe/stripe-cli/stripe
# Linux: See https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded
```

**Expected output:**
```
✔ Trigger succeeded! Check dashboard for event details.
```

### Test 3: Check Supabase Logs

```bash
# Watch logs in real-time
supabase functions logs stripe-webhook --follow

# Or check recent logs
supabase functions logs stripe-webhook --limit 20
```

**What to look for:**
- ✅ `"Hello from Stripe Webhook!"`
- ✅ `"🔔 Event received: evt_xxxxx"`
- ✅ `"Handling checkout.session.completed: cs_xxxxx"`
- ✅ `"User [uuid] subscription activated"`
- ❌ NOT: `"Missing authorization header"`
- ❌ NOT: `"No Stripe signature in request headers"`

### Test 4: Verify Database Updates

After sending a test webhook, check if the database was updated:

```sql
-- Run in Supabase SQL Editor
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

**Expected result:**
- ✅ New rows with `stripe_customer_id` populated
- ✅ `subscription_status` = 'active' or 'trial'
- ✅ `subscription_end_date` set to future date

---

## 🔍 Troubleshooting

### Issue: Still getting 401 errors

**Possible causes:**
1. Function not deployed with new configuration
2. Webhook URL still includes `?apikey=` parameter
3. Configuration not properly saved in `config.toml`

**Solutions:**
```bash
# Re-deploy the function
supabase functions deploy stripe-webhook

# Verify config.toml has the correct section
cat supabase/config.toml | grep -A 2 "stripe-webhook"

# Should show:
# [functions.stripe-webhook]
# verify_jwt = false
```

### Issue: "Invalid signature" errors

**Possible causes:**
1. `STRIPE_WEBHOOK_SECRET` not set or incorrect
2. Using wrong webhook secret (test vs live mode)
3. Clock skew on server

**Solutions:**
```bash
# Verify webhook secret is set
supabase secrets list | grep STRIPE_WEBHOOK_SECRET

# Update webhook secret
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Re-deploy after updating secrets
supabase functions deploy stripe-webhook
```

### Issue: Database not updating

**Possible causes:**
1. Webhook signature verified but handler function failing
2. Missing `supabase_user_id` in Stripe checkout metadata
3. RLS policies blocking updates (shouldn't happen with service role key)

**Solutions:**
```bash
# Check detailed logs for errors
supabase functions logs stripe-webhook --limit 50

# Look for error messages in the handler functions
# Check for "Failed to update user after checkout"
# Check for "Could not find user for subscription"
```

### Issue: Function logs show "Webhook signature verified successfully" but no database updates

**Possible causes:**
1. Event type not handled by function
2. Missing metadata in Stripe checkout session
3. Database connection issues

**Solutions:**
1. Check which event types are handled in `index.ts`:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

2. Verify Stripe checkout includes `metadata.supabase_user_id`

3. Check Supabase service role key is set correctly

---

## 📊 Monitoring

### Stripe Dashboard

Monitor webhook deliveries:
- URL: https://dashboard.stripe.com/test/webhooks
- Click on your endpoint to see recent deliveries
- Check success rate and response times

**Healthy webhook:**
- ✅ Success rate: 100%
- ✅ Response time: < 1 second
- ✅ Status: 200 OK

### Supabase Dashboard

Monitor function invocations:
- Go to: Edge Functions → stripe-webhook
- Check invocation count and error rate
- Review logs for any errors

**Healthy function:**
- ✅ Error rate: 0%
- ✅ Average execution time: < 500ms
- ✅ No 401 or 400 errors in logs

---

## ✅ Success Checklist

After deployment, verify:

- [ ] Function deployed successfully (`supabase functions list`)
- [ ] Webhook URL in Stripe has NO query parameters
- [ ] Environment variables set (`supabase secrets list`)
- [ ] Test webhook returns 200 OK (not 401)
- [ ] Supabase logs show "Event received" messages
- [ ] Database updates when webhooks are sent
- [ ] No "Missing authorization header" errors

---

## 🎯 Summary

**What was changed:**
1. Added `[functions.stripe-webhook]` with `verify_jwt = false` to `config.toml`
2. Removed incorrect `.supabase.yaml` file
3. Updated documentation

**What you need to do:**
1. Deploy the function: `supabase functions deploy stripe-webhook`
2. Fix webhook URL in Stripe (remove `?apikey=`)
3. Verify environment variables are set
4. Test with Stripe CLI or Dashboard
5. Verify database updates

**Estimated time:** 10-15 minutes

**Difficulty:** Easy - mostly configuration and deployment

---

## 📚 References

- [Supabase Edge Functions Configuration](https://supabase.com/docs/guides/functions/function-configuration)
- [Supabase Stripe Webhook Example](https://supabase.com/docs/guides/functions/examples/stripe-webhooks)
- [Stripe Webhook Documentation](https://stripe.com/docs/webhooks)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)

---

**Ready to deploy? Run the commands in Step 1 to get started! 🚀**
